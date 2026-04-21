// AWS S3 integration for file storage

import AWS from 'aws-sdk'

const s3 = new AWS.S3({ region: process.env.AWS_REGION })

export async function uploadFile(bucket: string, key: string, body: Buffer, contentType: string) {
  return s3.upload({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }).promise()
}

export async function getFileUrl(bucket: string, key: string) {
  return s3.getSignedUrl('getObject', { Bucket: bucket, Key: key, Expires: 60 * 60 })
}