import type { DeleteRequest } from '../models/DeleteRequest';
import type { QuestionQueryRequest } from '../models/QuestionQueryRequest';
import type { ResponseEntityBoolean } from '../models/ResponseEntityBoolean';
import type { ResponseEntityPageQuestionVO } from '../models/ResponseEntityPageQuestionVO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class QuestionThumbControllerService {
  /**
   * 鐐硅禐棰樼洰
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static save(
    requestBody: DeleteRequest
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/question/thumb/save',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * 鍒嗛〉鏌ヨ鐢ㄦ埛鐐硅禐鐨勯鐩?     * @param requestBody
   * @returns ResponseEntityPageQuestionVO OK
   * @throws ApiError
   */
  public static page(
    requestBody: QuestionQueryRequest
  ): CancelablePromise<ResponseEntityPageQuestionVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/question/question/thumb/page',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * 鍙栨秷鐐硅禐
   * @param requestBody
   * @returns ResponseEntityBoolean OK
   * @throws ApiError
   */
  public static remove(
    requestBody: DeleteRequest
  ): CancelablePromise<ResponseEntityBoolean> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/question/question/thumb/remove',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
