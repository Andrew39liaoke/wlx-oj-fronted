/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteRequest } from '../models/DeleteRequest';
import type { QuestionActionStatusRequest } from '../models/QuestionActionStatusRequest';
import type { QuestionAddRequest } from '../models/QuestionAddRequest';
import type { QuestionEditRequest } from '../models/QuestionEditRequest';
import type { QuestionQueryRequest } from '../models/QuestionQueryRequest';
import type { QuestionSubmitAddRequest } from '../models/QuestionSubmitAddRequest';
import type { QuestionSubmitQueryRequest } from '../models/QuestionSubmitQueryRequest';
import type { QuestionUpdateRequest } from '../models/QuestionUpdateRequest';
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityLong } from '../models/ResponseEntityLong';
import type { ResponseEntityPageQuestion } from '../models/ResponseEntityPageQuestion';
import type { ResponseEntityPageQuestionSubmitVO } from '../models/ResponseEntityPageQuestionSubmitVO';
import type { ResponseEntityPageQuestionVO } from '../models/ResponseEntityPageQuestionVO';
import type { ResponseEntityQuestion } from '../models/ResponseEntityQuestion';
import type { ResponseEntityQuestionActionStatusResponse } from '../models/ResponseEntityQuestionActionStatusResponse';
import type { ResponseEntityQuestionVO } from '../models/ResponseEntityQuestionVO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class QuestionControllerService {
  /**
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static updateQuestion(
    requestBody: QuestionUpdateRequest
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/update',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityPageQuestionSubmitVO OK
   * @throws ApiError
   */
  public static listQuestionSubmitByPage(
    requestBody: QuestionSubmitQueryRequest
  ): CancelablePromise<ResponseEntityPageQuestionSubmitVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/question_submit/list/page',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityLong OK
   * @throws ApiError
   */
  public static doQuestionSubmit(
    requestBody: QuestionSubmitAddRequest
  ): CancelablePromise<ResponseEntityLong> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/question_submit/do',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityPageQuestionVO OK
   * @throws ApiError
   */
  public static listMyQuestionVoByPage(
    requestBody: QuestionQueryRequest
  ): CancelablePromise<ResponseEntityPageQuestionVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/my/list/page/vo',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityPageQuestion OK
   * @throws ApiError
   */
  public static listQuestionByPage(
    requestBody: QuestionQueryRequest
  ): CancelablePromise<ResponseEntityPageQuestion> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/list/page',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityPageQuestionVO OK
   * @throws ApiError
   */
  public static listQuestionVoByPage(
    requestBody: QuestionQueryRequest
  ): CancelablePromise<ResponseEntityPageQuestionVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/list/page/vo',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static editQuestion(
    requestBody: QuestionEditRequest
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/edit',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static deleteQuestion(
    requestBody: DeleteRequest
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/delete',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityLong OK
   * @throws ApiError
   */
  public static addQuestion1(
    requestBody: QuestionAddRequest
  ): CancelablePromise<ResponseEntityLong> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/add',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityQuestionActionStatusResponse OK
   * @throws ApiError
   */
  public static getActionStatus(
    requestBody: QuestionActionStatusRequest
  ): CancelablePromise<ResponseEntityQuestionActionStatusResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/action/status',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param id
   * @returns ResponseEntityQuestion OK
   * @throws ApiError
   */
  public static getQuestionById1(
    id: number
  ): CancelablePromise<ResponseEntityQuestion> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/question/get',
      query: {
        id: id,
      },
    });
  }

  /**
   * @param id
   * @returns ResponseEntityQuestionVO OK
   * @throws ApiError
   */
  public static getQuestionVoById(
    id: number
  ): CancelablePromise<ResponseEntityQuestionVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/question/get/vo',
      query: {
        id: id,
      },
    });
  }
}
