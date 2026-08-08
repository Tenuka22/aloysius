"use client"

export async function convertToWebp(file: File): Promise<File> {
  if (file.type === "image/webp") return file

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Conversion to webp failed"))
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }))
      },
      "image/webp",
      0.85
    )
  })
}
