export function Image(url: string) {
  const loaded = loadImage(url);
  loading.push(loaded);
  return (obj: any, key: string) => {
    loaded.then(img => {
      obj[key] = img;
    });
  }
}

export function doneLoadingImages() {
  return Promise.all(loading);
}

const loading: Promise<HTMLImageElement>[] = [];

function loadImage(url: string) {
  const img = document.createElement('img');
  img.src = url;
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
  });
}
