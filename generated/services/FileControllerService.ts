/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityFileInfo } from '../models/ResponseEntityFileInfo';
import type { ResponseEntityFileUploadResponse } from '../models/ResponseEntityFileUploadResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class FileControllerService {
  /**
   * 涓婁紶鏂囦欢
   * @param biz
   * @param requestBody
   * @returns ResponseEntityFileUploadResponse OK
   * @throws ApiError
   */
  public static uploadFile(
    biz: string = 'default',
    requestBody?: {
      file: Blob;
    }
  ): CancelablePromise<ResponseEntityFileUploadResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/file/upload',
      query: {
        biz: biz,
      },
      formData: requestBody,
    });
  }

  /**
   * 涓婁紶甯栧瓙灏侀潰
   * @param postId
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static uploadPostCover(
    postId: number,
    requestBody?: {
      file: Blob;
    }
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/file/upload/post/cover',
      query: {
        postId: postId,
      },
      formData: requestBody,
    });
  }

  /**
   * 涓婁紶鐝骇鏂囦欢锛堜粎闄?PDF锛?     * @param classId
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static uploadClassFile(
    classId: number,
    requestBody?: {
      file: Blob;
    }
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/file/upload/class/file',
      query: {
        classId: classId,
      },
      formData: requestBody,
    });
  }

  /**
   * 涓婁紶澶村儚
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static uploadAvatar(requestBody?: {
    file: Blob;
  }): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/file/upload/avatar',
      formData: requestBody,
    });
  }

  /**
   * 鍒犻櫎鏂囦欢
   * @param fileId
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static deleteFile(
    fileId: number
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/file/delete',
      query: {
        fileId: fileId,
      },
    });
  }

  /**
   * 鑾峰彇鏂囦欢淇℃伅
   * @param fileId
   * @returns ResponseEntityFileInfo OK
   * @throws ApiError
   */
  public static getFileInfo(
    fileId: number
  ): CancelablePromise<ResponseEntityFileInfo> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/file/info',
      query: {
        fileId: fileId,
      },
    });
  }
}
