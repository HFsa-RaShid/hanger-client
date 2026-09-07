
"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { removeBackground } from "@imgly/background-removal";

export default function Home() {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tshirtColor, setTshirtColor] = useState("#ffffff");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: 500,
      height: 500,
      backgroundColor: "#f3f4f6",
    });
    fabricCanvasRef.current = canvas;

    fabric.FabricImage.fromURL("/fabric.png").then((img) => {
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = img.width ?? canvasWidth;
      const imgHeight = img.height ?? canvasHeight;

      const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);

      img.set({
        originX: "center",
        originY: "center",
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = canvas.getActiveObject();
        if (active) {
          canvas.remove(active);
          canvas.renderAll();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas.dispose();
    };
  }, []);

  const handleColorChange = (color: string) => {
    setTshirtColor(color);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const tshirtImg = objects[0] as fabric.FabricImage | undefined;
    if (!tshirtImg) return;

    tshirtImg.filters = [
      new fabric.filters.BlendColor({
        color: color,
        mode: "multiply",
      }),
    ];
    tshirtImg.applyFilters();
    canvas.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    fabric.FabricImage.fromURL(url).then((img) => {
      img.scaleToWidth(150);
      img.set({
        left: 175,
        top: 175,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });

    e.target.value = "";
  };

  // 🟢 যেকোনো ব্যাকগ্রাউন্ড AI দিয়ে কাটার ফাংশন
  const handleRemoveAnyBg = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj || !(activeObj instanceof fabric.FabricImage)) {
      alert("অনুগ্রহ করে ক্যানভাস থেকে একটি স্টিকার বা ছবি সিলেক্ট করুন!");
      return;
    }

    try {
      setLoading(true);

      // ১. সিলেক্টেড অবজেক্ট থেকে ছবির URL বের করা
      const element = activeObj.getElement() as HTMLImageElement;
      const imageUrl = element.src;

      // ২. AI প্যাকেজ দিয়ে ব্যাকগ্রাউন্ড রিমুভ করা
      const blob = await removeBackground(imageUrl);
      const transparentUrl = URL.createObjectURL(blob);

      // ৩. পুরোনো ছবিটির পজিশন ও স্কেল মনে রাখা
      const left = activeObj.left;
      const top = activeObj.top;
      const scaleX = activeObj.scaleX;
      const scaleY = activeObj.scaleY;
      const angle = activeObj.angle;

      // ৪. ক্যানভাস থেকে পুরোনো অবজেক্ট মুছে নতুন ট্রান্সপারেন্ট ছবি বসানো
      canvas.remove(activeObj);

      fabric.FabricImage.fromURL(transparentUrl).then((newImg) => {
        newImg.set({
          left: left,
          top: top,
          scaleX: scaleX,
          scaleY: scaleY,
          angle: angle,
        });
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        canvas.renderAll();
      });
    } catch (error) {
      console.error("Background removal failed:", error);
      alert("ব্যাকগ্রাউন্ড রিমুভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.renderAll();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">T-Shirt Customizer Demo</h1>

      <div className="border rounded-lg shadow-sm">
        <canvas ref={canvasElRef} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">T-shirt Color:</label>
          <input
            type="color"
            value={tshirtColor}
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </div>

        <button
          className="border px-4 py-2 rounded"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Sticker/Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* 🟢 AI Background Remove Button */}
        <button
          disabled={loading}
          className="border px-4 py-2 rounded bg-indigo-600 text-white disabled:bg-gray-400"
          onClick={handleRemoveAnyBg}
        >
          {loading ? "Processing..." : "Remove BG (AI)"}
        </button>

        <button
          className="border px-4 py-2 rounded text-red-600"
          onClick={handleDeleteSelected}
        >
          Delete Selected
        </button>
      </div>

    </div>
  );
}