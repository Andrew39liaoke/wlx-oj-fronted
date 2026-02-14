/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WeChatRequest } from '../models/WeChatRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class WxControllerService {
  /**
   * @param weChatRequestDto
   * @returns string OK
   * @throws ApiError
   */
  public static checkSignature(
    weChatRequestDto: WeChatRequest
  ): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/wechat/portal',
      query: {
        weChatRequestDto: weChatRequestDto,
      },
    });
  }

  /**
   * @param code
   * @param state
   * @returns string OK
   * @throws ApiError
   */
  public static receiveCallback(
    code: string,
    state: string
  ): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/wechat/callback',
      query: {
        code: code,
        state: state,
      },
    });
  }

  /**
   * @param state
   * @returns any OK
   * @throws ApiError
   */
  public static checkLogin(state: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/wechat/check',
      query: {
        state: state,
      },
    });
  }
}
