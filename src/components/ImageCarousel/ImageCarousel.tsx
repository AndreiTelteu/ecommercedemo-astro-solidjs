import { createEffect, For } from 'solid-js';
import useState from '~/lib/useState';
import './ImageCarousel.scss';

export default function ImageCarousel({ images = [], showThumbnails = false }) {
  const state = useState({
    selectedImage: 0,
  });
  let bigImageRefs = {};
  createEffect(() => {
    bigImageRefs?.[state.selectedImage]?.scrollIntoView?.({
      behavior: 'smooth',
    })
  });
  
  let filteredImages = images.filter(item => !String(item).match(/thumbnail/))
  return (
    <>
      <div class="image-carousel__big">
        <For each={filteredImages} children={(item, index) => (
          <div class="image-carousel__big-image" ref={(el) => bigImageRefs[index()] = el}>
            <img src={item} alt="" lazy />
          </div>
        )} />
      </div>
      <div class="image-carousel__thumbnails">
        <For each={filteredImages} children={(item, index) => (
          <div
            class={`image-carousel__thumbnail ${state?.selectedImage  == index()? 'is-selected':''}`}
            onClick={() => state.selectedImage = index()}
          >
            <img src={item} alt="" lazy />
          </div>
        )} />
      </div>
    </>
  );
}
