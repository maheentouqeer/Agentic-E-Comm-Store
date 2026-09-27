import laptopImg from "@/assets/cat-laptop.jpg";
import monitorImg from "@/assets/cat-monitor.jpg";
import accessoryImg from "@/assets/cat-accessory.jpg";
import type { ProductCategory } from "@/data/products";

export const categoryImages: Record<ProductCategory, string> = {
  laptop: laptopImg,
  monitor: monitorImg,
  accessory: accessoryImg,
};
