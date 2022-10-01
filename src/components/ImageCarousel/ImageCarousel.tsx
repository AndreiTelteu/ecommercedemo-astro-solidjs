import { createEffect, ErrorBoundary, For, lazy, Suspense } from 'solid-js';
import useState from '~/lib/useState';
// import { Swiper } from 'solidjs-swiper';
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
      {/* {import.meta.env.SSR == false ? (
        <Swiper
          client:only="solid"
          items={filteredImages}
          children={(item: any) => (
            <img
              src={item}
              alt=""
              style="width: 100%; height: 100%; object-fit: cover; display: block;"
            />
          )}
        />
      ) : null} */}
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
