// app/utils/s3.server.ts
import {
  unstable_parseMultipartFormData,
  UploadHandler,
  writeAsyncIterableToWritable,
} from '@remix-run/node';
import S3 from 'aws-sdk/clients/s3';
import cuid from 'cuid';
import { PassThrough } from 'stream';

// 1
const s3 = new S3({
  region: process.env.KUDOS_BUCKET_REGION,
  accessKeyId: process.env.KUDOS_ACCESS_KEY_ID,
  secretAccessKey: process.env.KUDOS_SECRET_ACCESS_KEY,
});

const uploadHandler: UploadHandler = async ({ name, filename = '', data }) => {
  if (name !== 'profile-pic') {
    return;
  }

  // 3
  const { Location } = await uploadStreamToS3(data, filename);

  // 4
  return Location;
};

export async function uploadAvatar(request: Request) {
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  console.log(formData);

  const file = formData.get('profile-pic')?.toString() || '';

  return file;
}

const uploadStream = (filename: string) => {
  const pass = new PassThrough();
  return {
    writeStream: pass,
    promise: s3
      .upload({
        Bucket: process.env.KUDOS_BUCKET_NAME || '',
        Key: `${cuid()}.${filename.split('.').slice(-1)}`,
        Body: pass,
      })
      .promise(),
  };
};

export async function uploadStreamToS3(data: any, filename: string) {
  const stream = uploadStream(filename);
  await writeAsyncIterableToWritable(data, stream.writeStream);
  const file = await stream.promise;
  return file;
}
