import ColorGrading from '@/ColorGrading';

const grading = new ColorGrading();
window.addEventListener('resize', grading.onResize.bind(grading));

document.getElementById('lut-table').addEventListener('change', event => {
  grading.setColorGrading(event.target.value, false);
});
