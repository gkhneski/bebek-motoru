import Replicate from "replicate";
import Jimp from "jimp";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { image } = body || {};

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let base64 = image;
    if (base64.startsWith("data:")) {
      base64 = base64.split(",")[1];
    }

    const buffer = Buffer.from(base64, "base64");
    const jimg = await Jimp.read(buffer);
    jimg.scaleToFit(768, 768);
    const processed = await jimg.getBufferAsync(Jimp.MIME_PNG);
    const dataUri = `data:image/png;base64,${processed.toString("base64")}`;

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      "fofr/latent-consistency-model:683d19a8671b0340db192847cc4325a3547d9453f41a797b4f637bc120df8462",
      {
        input: {
          image: dataUri,
          prompt:
            "hyperrealistic close-up photo of a cute newborn baby, sleeping, chubby cheeks, soft skin, 8k uhd, soft studio lighting",
          negative_prompt:
            "black and white, ultrasound, medical scan, skeleton, skull, deformed, ugly, blurry",
          num_inference_steps: 6,
          guidance_scale: 1.5,
          controlnet_image: dataUri,
          controlnet_type: "canny",
          controlnet_conditioning_scale: 0.55,
        },
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;

    return new Response(
      JSON.stringify({ success: true, result: output, imageUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Generation error:", err);
    return new Response(
      JSON.stringify({
        error: "Generation failed",
        details: String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
