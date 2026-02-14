/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteRequest } from '../models/DeleteRequest';
import type { PostAddRequest } from '../models/PostAddRequest';
import type { PostQueryRequest } from '../models/PostQueryRequest';
import type { PostUpdateRequest } from '../models/PostUpdateRequest';
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityLong } from '../models/ResponseEntityLong';
import type { ResponseEntityPagePostVO } from '../models/ResponseEntityPagePostVO';
import type { ResponseEntityPostVO } from '../models/ResponseEntityPostVO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PostControllerService {
  /**
   * 鏍规嵁涓婚敭鏇存柊甯栧瓙
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static update(
    requestBody: PostUpdateRequest
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/api/post/update',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * 淇濆瓨甯栧瓙
   * @param requestBody
   * @returns ResponseEntityLong OK
   * @throws ApiError
   */
  public static save1(
    requestBody: PostAddRequest
  ): CancelablePromise<ResponseEntityLong> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/post/save',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * 鍒嗛〉鏌ヨ甯栧瓙
   * @param requestBody
   * @returns ResponseEntityPagePostVO OK
   * @throws ApiError
   */
  public static page1(
    requestBody: PostQueryRequest
  ): CancelablePromise<ResponseEntityPagePostVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/post/page',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * 鍒嗛〉鏌ヨ鑷繁鐨勫笘瀛?     * @param requestBody
   * @returns ResponseEntityPagePostVO OK
   * @throws ApiError
   */
  public static pageSelf(
    requestBody: PostQueryRequest
  ): CancelablePromise<ResponseEntityPagePostVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/post/pageSelf',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * 鏍规嵁涓婚敭鑾峰彇甯栧瓙
   * @param id
   * @returns ResponseEntityPostVO OK
   * @throws ApiError
   */
  public static getInfo(id: number): CancelablePromise<ResponseEntityPostVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/post/getInfo/{id}',
      path: {
        id: id,
      },
    });
  }

  /**
   * 鍒犻櫎涓婚敭甯栧瓙
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static remove1(
    requestBody: DeleteRequest
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/post/remove',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
