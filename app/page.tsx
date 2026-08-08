"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";

export default function Home() {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tshirtColor, setTshirtColor] = useState("#ffffff");

  // ১. Canvas Setup + T-shirt Base Image Load
  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: 500,
      height: 500,
      backgroundColor: "#f3f4f6",
    });
    fabricCanvasRef.current = canvas;

    // t-shirt base image লোড করা (public ফোল্ডার থেকে)
    fabric.FabricImage.fromURL("/fabric.png").then((img) => {
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = img.width ?? canvasWidth;
      const imgHeight = img.height ?? canvasHeight;

      // অনুপাত ঠিক রেখে canvas এর ভেতরে পুরোপুরি ফিট করানো (contain)
      const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);

      img.set({
        originX: "center",
        originY: "center",
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false, // t-shirt নিজে move/select করা যাবে না
        evented: false,
      });
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
    });

    // Delete key দিয়ে সিলেক্টেড অবজেক্ট মুছে ফেলা
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

  // ২. T-shirt এর color change করা (multiply blend দিয়ে বাস্তবসম্মত দেখাবে)
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

  // ৩. Sticker/Image আপলোড করে canvas এ বসানো
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    fabric.FabricImage.fromURL(url).then((img) => {
      img.scaleToWidth(150); // ডিফল্ট সাইজ
      img.set({
        left: 175,
        top: 175,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });

    e.target.value = ""; // একই ফাইল আবার সিলেক্ট করা যাবে যেন
  };

  // ৪. সিলেক্টেড অবজেক্ট ডিলিট বাটন দিয়ে মোছা
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

      {/* Canvas */}
      <div className="border rounded-lg shadow-sm">
        <canvas ref={canvasElRef} />
      </div>

      {/* Controls */}
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

        <button
          className="border px-4 py-2 rounded text-red-600"
          onClick={handleDeleteSelected}
        >
          Delete Selected
        </button>
      </div>

      <p className="text-sm text-gray-500">
        ছবিতে ক্লিক করে drag করুন, কোনায় থাকা হ্যান্ডেল দিয়ে resize/rotate করুন।
        Selected অবস্থায় Delete/Backspace চাপলেই মুছে যাবে।
      </p>
    </div>
  );
}