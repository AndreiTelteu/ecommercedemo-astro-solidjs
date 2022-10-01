import { createEffect, For } from 'solid-js';
import useState from '~/lib/useState';
import { Swiper } from 'solidjs-swiper';
import './ImageCarousel.scss';

export default function ImageCarousel({ images = [], showThumbnails = false }) {
  const state = useState({
    changeImage: 0,
    selectedImage: 0,
  });
  
  let filteredImages = images.filter(item => !String(item).match(/thumbnail/))
  return (
    <>
      {import.meta.env.SSR == false ? (
        <Swiper
          items={filteredImages}
          index={state.changeImage}
          onChange={(index) => state.selectedImage = index}
          children={(item: any) => (
            <img
              src={item} alt="" lazy
              style="width: 100%; height: 100%; object-fit: cover; display: block;"
            />
          )}
        />
      ) : null}
      <div class="image-carousel__thumbnails">
        <For each={filteredImages} children={(item, index) => (
          <div
            class={`image-carousel__thumbnail ${state?.selectedImage  == index()? 'is-selected':''}`}
            onClick={() => {state.selectedImage = index(); state.changeImage = index()}}
          >
            <img src={item} alt="" lazy />
          </div>
        )} />
      </div>
    </>
  );
}
