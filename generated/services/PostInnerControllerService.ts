/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PostInnerControllerService {
  /**
   * @param postId
   * @param coverUrl
   * @returns boolean OK
   * @throws ApiError
   */
  public static updatePostCover(
    postId: number,
    coverUrl: string
  ): CancelablePromise<boolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/post/inner/updateCover',
      query: {
        postId: postId,
        coverUrl: coverUrl,
      },
    });
  }
}
