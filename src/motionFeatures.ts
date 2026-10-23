// The animation features the app uses (animate / variants / exit / hover and tap),
// without drag and layout animation, which nothing here needs. Loaded on demand by
// <LazyMotion> in App.tsx so the animation engine is not in the first download.
import { domAnimation } from "framer-motion";

export default domAnimation;
