import { Agent } from '@dfinity/agent';
import { getStorageActor, Content } from '../services/actorService';

const ERR = 'err';
const MAX_CHUNK_SIZE = 1024 * 1024 * 2;

export interface DataStorageInfoType {
  contentId: string;
  dataCanisterId: string;
  dataUrl: string;
  mappingId?: string;
}
// Single method to call to upload any file anywhere on UI
export async function uploadBlob(
  imageBlob: Blob,
  imageSize: number,
  imageMimeType: string,
  mappingId?: string,
  contentId?: string,
  agent?: Agent
): Promise<DataStorageInfoType> {
  if (contentId == null) {
    contentId = await getNewContentId(agent);
  }
  console.log(contentId);
  const putChunkPromises: Promise<string>[] = [];
  let offset = 1;
  for (
    let byteStart = 0;
    byteStart < imageBlob.size;
    byteStart += MAX_CHUNK_SIZE, offset++
  ) {
    putChunkPromises.push(
      processAndUploadChunk(
        MAX_CHUNK_SIZE,
        contentId,
        imageBlob,
        byteStart,
        offset,
        imageSize,
        imageMimeType,
        agent
      )
    );
  }
  let res: string[] = await Promise.all(putChunkPromises);
  const isDevelopment =
    window.location.origin.includes('localhost') ||
    window.location.origin.includes('127.0.0.1');
  return {
    contentId: contentId,
    dataCanisterId: res[0],
    dataUrl: isDevelopment
      ? `http://localhost:8080/storage?canisterId=${res[0]}&contentId=${contentId}`
      : `https://${res[0]}.raw.icp0.io/storage?contentId=${contentId}`,
    mappingId,
  };
}

export async function getNewContentId(agent?: Agent): Promise<string> {
  const result = await (await getStorageActor(agent)).getNewContentId();
  if (ERR in result) {
    throw new Error(result.err);
  } else {
    return result.ok;
  }
}

async function uploadBlobChunk(content: Content, agent?: Agent): Promise<string> {
  const result = await (await getStorageActor(agent)).uploadBlob(content);
  if (ERR in result) {
    throw new Error(result.err);
  } else {
    return result.ok;
  }
}

async function processAndUploadChunk(
  MAX_CHUNK_SIZE: number,
  contentId: string,
  blob: Blob,
  byteStart: number,
  offset: number,
  fileSize: number,
  fileMimeType: string,
  agent?: Agent
): Promise<string> {
  const blobSlice = blob.slice(
    byteStart,
    Math.min(Number(fileSize), byteStart + MAX_CHUNK_SIZE),
    blob.type
  );

  const bsf = await blobSlice.arrayBuffer();
  let dataCanisterId = await uploadBlobChunk({
    contentId: contentId,
    contentSize: BigInt(fileSize),
    mimeType: fileMimeType,
    offset: BigInt(offset),
    totalChunks: BigInt(Number(Math.ceil(fileSize / MAX_CHUNK_SIZE))),
    chunkData: encodeArrayBuffer(bsf) as any,
  }, agent);
  return dataCanisterId;
}

const encodeArrayBuffer = (file: ArrayBuffer): number[] =>
  Array.from(new Uint8Array(file));