/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClassQueryRequest } from '../models/ClassQueryRequest';
import type { ClassQuestionQueryRequest } from '../models/ClassQuestionQueryRequest';
import type { ClassStudentQueryRequest } from '../models/ClassStudentQueryRequest';
import type { QuestionAddRequest } from '../models/QuestionAddRequest';
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityListMapStringObject } from '../models/ResponseEntityListMapStringObject';
import type { ResponseEntityLong } from '../models/ResponseEntityLong';
import type { ResponseEntityPageClassVO } from '../models/ResponseEntityPageClassVO';
import type { ResponseEntityPageQuestionVO } from '../models/ResponseEntityPageQuestionVO';
import type { ResponseEntityPageUser } from '../models/ResponseEntityPageUser';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ClassControllerService {
  /**
   * @param classIds
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static quitClass(
    classIds: Array<number>
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/class/quit',
      query: {
        classIds: classIds,
      },
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityPageQuestionVO OK
   * @throws ApiError
   */
  public static getClassQuestionPage(
    requestBody: ClassQuestionQueryRequest
  ): CancelablePromise<ResponseEntityPageQuestionVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/class/question/page',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param classId
   * @param problemIds
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static deleteClassProblems(
    classId: number,
    problemIds: Array<number>
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/class/problem/delete',
      query: {
        classId: classId,
        problemIds: problemIds,
      },
    });
  }

  /**
   * @param classId
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static addClassProblems(
    classId: number,
    requestBody: QuestionAddRequest
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/class/problem/add',
      query: {
        classId: classId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityPageClassVO OK
   * @throws ApiError
   */
  public static getClassPage(
    requestBody: ClassQueryRequest
  ): CancelablePromise<ResponseEntityPageClassVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/class/page',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param requestBody
   * @returns ResponseEntityPageClassVO OK
   * @throws ApiError
   */
  public static getStudentClasses(
    requestBody: ClassQueryRequest
  ): CancelablePromise<ResponseEntityPageClassVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/class/student/classes',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * @param invitationCode
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static joinClass(
    invitationCode: string
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/class/join',
      query: {
        invitationCode: invitationCode,
      },
    });
  }

  /**
   * @param name
   * @returns ResponseEntityLong OK
   * @throws ApiError
   */
  public static addClass(name: string): CancelablePromise<ResponseEntityLong> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/auth/class/add',
      query: {
        name: name,
      },
    });
  }

  /**
   * @param classStudentQueryRequest
   * @returns ResponseEntityPageUser OK
   * @throws ApiError
   */
  public static getClassStudentPage(
    classStudentQueryRequest: ClassStudentQueryRequest
  ): CancelablePromise<ResponseEntityPageUser> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/class/student/page',
      query: classStudentQueryRequest,
    });
  }

  /**
   * @param classId
   * @returns ResponseEntityListMapStringObject OK
   * @throws ApiError
   */
  public static getClassQuestionSubmitInfo(
    classId: number
  ): CancelablePromise<ResponseEntityListMapStringObject> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/auth/class/question/submitInfo',
      query: {
        classId: classId,
      },
    });
  }
}
