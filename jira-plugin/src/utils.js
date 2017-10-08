import map from 'lodash/map';
import defaults from 'lodash/defaults';

function getCenter(width, heigth) {
  const totalScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
  const totalScreenRight = window.screenTop !== undefined ? window.screenTop : screen.top;
  const screenWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  const screenHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
  return {
    left: ((screenWidth / 2) - (width / 2)) + totalScreenLeft,
    top: ((screenHeight / 2) - (heigth / 2)) + totalScreenRight
  };
}

function toOptionsString(options) {
  return map(options, (value, key) => {
    return key + '=' + value;
  }).join(', ');
}

export function centerPopup(url, title, options) {
  options = {
    width: 800,
    height: 600,
    ...options
  };
  return window.open(
    url,
    title,
    toOptionsString(defaults(options, getCenter(options.width, options.height)))
  );
}

export function waitForDocument(cb) {
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    cb();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      cb();
    });
  }
}