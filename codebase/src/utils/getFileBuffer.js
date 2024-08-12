export default async function getFileBuffer(file) {
  const fileBuffer = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(e.target.result);
    };
    reader.readAsArrayBuffer(file);
  });

  return fileBuffer;
};

export async function getFileDataURL(file) {
  const fileDataURL = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(e.target.result);
    };
    reader.readAsDataURL(file);
  });

  return fileDataURL;
}
