import Image from "next/image";

export default function ClothingCard({ item }: { item: any }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-md flex flex-col items-center w-80">
      <Image
        src={item.imageUrl || "/placeholder.png"}
        alt={item.name}
        width={250}
        height={250}
        className="rounded-xl object-cover"
      />
      <h2 className="text-xl font-semibold mt-3">{item.name}</h2>
      <p className="text-gray-600">{item.category}</p>
      <p className="text-sm text-gray-400 mt-1">
        by {item.owner?.name || "Unknown"}
      </p>
    </div>
  );
}
