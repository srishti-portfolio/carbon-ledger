// icons.jsx — maps catalog icon-name strings to lucide components.
import {
  Car, Bike, Bus, Train, Plane, Zap, Wind, Beef, UtensilsCrossed, Leaf, ShoppingBag, Home,
  Lightbulb, AirVent, Flame, Snowflake, Droplets, Thermometer, Fan, Tv, Monitor, Microwave,
  Coffee, Shirt, BatteryCharging,
} from "lucide-react";

const MAP = {
  Car, Bike, Bus, Train, Plane, Zap, Wind, Beef, UtensilsCrossed, Leaf, ShoppingBag, Home,
  Lightbulb, AirVent, Flame, Snowflake, Droplets, Thermometer, Fan, Tv, Monitor, Microwave,
  Coffee, Shirt, BatteryCharging,
};

export function Ic({ name, ...props }) {
  const Cmp = MAP[name] || Leaf;
  return <Cmp {...props} />;
}
