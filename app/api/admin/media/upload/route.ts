// app/api/admin/media/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const BUCKET = "pedefacil-media";
const SIZES = [64, 128, 256] as const;
const FORMATS = ["avif", "webp"] as const;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// garante que o bucket exista (cria se faltar)
async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (!error && data) return;
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "10mb",
    allowedMimeTypes: ["image/*"],
  });
  if (createErr) throw createErr;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const entity = (form.get("entity") as string) || "";
    const entityId = (form.get("entityId") as string) || "";

    // novo: suporte a modo "detached"
    const mode = String(form.get("mode") || "").toLowerCase();
    const detachedFlag = String(form.get("detached") || "").toLowerCase();
    const isDetached = mode === "detached" || detachedFlag === "1" || detachedFlag === "true";

    // validações mínimas por modo
    if (!file || !entity || (!isDetached && !entityId)) {
      return NextResponse.json({ error: "Parâmetros ausentes." }, { status: 400 });
    }
    if (!["product", "topping", "addon"].includes(entity)) {
      return NextResponse.json({ error: "Entity inválida." }, { status: 400 });
    }

    await ensureBucket();

    const input = Buffer.from(await file.arrayBuffer());

    // versionamento de caminho
    const stamp = Date.now();
    const shortHash = crypto.createHash("sha1").update(input).digest("hex").slice(0, 8);

    // novo: pasta diferente quando detached (sem entityId)
    const baseFolder = isDetached
      ? `prod/${entity}/tmp`
      : `prod/${entity}/${entityId}`;
    const folder = `${baseFolder}/${stamp}-${shortHash}`;

    // meta original
    const base = sharp(input);
    const meta = await base.metadata();
    const origW = meta.width ?? null;
    const origH = meta.height ?? null;

    // gera + envia variantes
    const uploaded: Record<string, { url: string; size: number; format: string }> = {};
    for (const size of SIZES) {
      const resized = sharp(input).resize({ width: size, withoutEnlargement: true });

      // AVIF
      {
        const buf = await resized.avif({ quality: 55 }).toBuffer();
        const key = `${folder}/${size}.avif`;
        const { error } = await supabase.storage.from(BUCKET).upload(key, buf, {
          contentType: "image/avif",
          cacheControl: "31536000",
          upsert: true,
        });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
        uploaded[`avif-${size}`] = { url: data.publicUrl, size, format: "avif" };
      }
      // WEBP
      {
        const buf = await resized.webp({ quality: 72 }).toBuffer();
        const key = `${folder}/${size}.webp`;
        const { error } = await supabase.storage.from(BUCKET).upload(key, buf, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
        uploaded[`webp-${size}`] = { url: data.publicUrl, size, format: "webp" };
      }
    }

    const mainUrl = uploaded["avif-256"]?.url || uploaded["webp-256"]?.url;

    const image_meta = {
      bucket: BUCKET,
      folder,
      original: { width: origW, height: origH, mime: file.type || meta.format },
      sizes: SIZES,
      formats: FORMATS,
      sources: uploaded,
      updated_at: new Date().toISOString(),
    };

    // ───────── modo DETACHED: só retorna as URLs/metadata ─────────
    if (isDetached) {
      return NextResponse.json({
        ok: true,
        image_url: mainUrl,
        image_meta,
        debug: { mode: "detached" },
      });
    }

    // ───────── modo ATTACH (padrão): atualiza o registro no DB ─────────
    const table = entity === "product" ? "products" : entity === "topping" ? "toppings" : "addons";

    // ---- UPDATE com verificação de persistência, schema explícito e fallbacks ----
    const q = supabase.schema("public").from(table);
    let strategy: "snake_full" | "snake_url_only" | "camel_full" | "camel_url_only" = "snake_full";

    // 1) tenta snake_case completo (image_url + image_meta)
    let upd = await q
      .update({ image_url: mainUrl, image_meta })
      .eq("id", entityId)
      .select("id, image_url, image_meta")
      .maybeSingle();

    if (upd.error) {
      const msg = (upd.error.message || "").toLowerCase();

      // 2) se 'image_meta' não existe na visão/cache → só image_url (snake_case)
      if (msg.includes("could not find") && msg.includes("image_meta")) {
        strategy = "snake_url_only";
        upd = await q
          .update({ image_url: mainUrl })
          .eq("id", entityId)
          .select("id, image_url")
          .maybeSingle();
      } else if (msg.includes("could not find") && msg.includes("image_url")) {
        // 3) se 'image_url' também não existe (REST camelCase?) → tenta camelCase com meta
        strategy = "camel_full";
        upd = await q
          .update({ imageUrl: mainUrl, imageMeta: image_meta } as any)
          .eq("id", entityId)
          .select("id, imageUrl, imageMeta")
          .maybeSingle();

        // 3.1) se camelCase com meta falhar p/ imageMeta → só imageUrl
        if (upd.error) {
          const msg2 = (upd.error.message || "").toLowerCase();
          if (msg2.includes("could not find") && msg2.includes("imagemeta")) {
            strategy = "camel_url_only";
            upd = await q
              .update({ imageUrl: mainUrl } as any)
              .eq("id", entityId)
              .select("id, imageUrl")
              .maybeSingle();
          } else {
            throw upd.error;
          }
        }
      } else {
        // outro erro: propague
        throw upd.error;
      }
    }

    if (upd.error) throw upd.error;

    // confere se o meta realmente persistiu (snake ou camel)
    const dataAny = (upd.data ?? {}) as any;
    const persistedMeta =
      (dataAny.image_meta && typeof dataAny.image_meta === "object" && Object.keys(dataAny.image_meta).length > 0) ||
      (dataAny.imageMeta && typeof dataAny.imageMeta === "object" && Object.keys(dataAny.imageMeta).length > 0);

    if (!persistedMeta) {
      console.warn(
        `[upload] image_meta não persistiu (strategy=${strategy}). Verifique se a origem REST é VIEW sem a coluna ou se faltou 'select pg_notify('pgrst','reload schema');'.`
      );
    }

    return NextResponse.json({
      ok: true,
      image_url: mainUrl,
      image_meta,
      debug: { strategy, persisted_meta: persistedMeta, mode: "attach" },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Upload falhou." }, { status: 500 });
  }
}
