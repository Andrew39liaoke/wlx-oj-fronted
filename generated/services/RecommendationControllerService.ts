/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecommendQueryRequest } from '../models/RecommendQueryRequest';
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityPageRecommendationVO } from '../models/ResponseEntityPageRecommendationVO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class RecommendationControllerService {
  /**
   * 获取题目推荐列表
   * @param requestBody
   * @returns ResponseEntityPageRecommendationVO OK
   * @throws ApiError
   */
  public static getQuestionRecommendations(
    requestBody: RecommendQueryRequest
  ): CancelablePromise<ResponseEntityPageRecommendationVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/recommend/question',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * 获取帖子推荐列表
   * @param requestBody
   * @returns ResponseEntityPageRecommendationVO OK
   * @throws ApiError
   */
  public static getPostRecommendations(
    requestBody: RecommendQueryRequest
  ): CancelablePromise<ResponseEntityPageRecommendationVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/recommend/post',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * 手动刷新推荐
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static refreshRecommendations(): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/recommend/refresh',
    });
  }
}
