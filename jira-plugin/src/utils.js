import _ from 'lodash';

function getCenter(width, heigth) {
  var totalScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
  var totalScreenRight = window.screenTop !== undefined ? window.screenTop : screen.top;
  var screenWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  var screenHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
  var left = ((screenWidth / 2) - (width / 2)) + totalScreenLeft;
  var top = ((screenHeight / 2) - (heigth / 2)) + totalScreenRight;
  return {
    left: left,
    top: top
  };
}

function toOptionsString(options) {
  debugger;
  return _.map(options, function (value, key) {
    return key + '=' + value;
  }).join(', ');
}

export function centerPopup(url, title, options) {
  options = _.defaults(options || {}, {
    width: 800,
    height: 600
  });
  options = _.defaults(options, getCenter(options.width, options.height));
  return window.open(url, title, toOptionsString(options));
}