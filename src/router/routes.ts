import { RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/ExampleView.vue';
import UserLayout from '@/layouts/UserLayout.vue';
import UserLoginView from '@/views/user/UserLoginView.vue';
import UserRegisterView from '@/views/user/UserRegisterView.vue';
import AdminView from '@/views/AdminView.vue';
import NoAuthView from '@/views/NoAuthView.vue';
import ACCESS_ENUM from '@/access/accessEnum';
import AddQuestionView from '@/views/question/AddQuestionView.vue';
import ManageQuestionView from '@/views/question/ManageQuestionView.vue';
import QuestionsView from '@/views/question/QuestionsView.vue';
import QuestionSubmitView from '@/views/question/QuestionSubmitView.vue';
import ViewQuestionView from '@/views/question/ViewQuestionView.vue';
import PostListView from '@/views/post/post-list.vue';
import ViewPostView from '@/views/post/ViewPostView.vue';
import AddPostView from '@/views/post/AddPostView.vue';
import RecommendView from '@/views/RecommendView.vue';
import UserCenter from '@/views/UserCenter/UserCenter.vue';
import AiChat from '@/views/AiChat.vue';
export const routes: Array<RouteRecordRaw> = [
  {
    path: '/user',
    name: '用户',
    component: UserLayout,
    children: [
      {
        path: '/user/login',
        name: '用户登录',
        component: UserLoginView,
      },
      {
        path: '/user/register',
        name: '用户注册',
        component: UserRegisterView,
      },
    ],
    meta: {
      hideInMenu: true,
    },
  },
  /*   {
    path: "/questions",
    name: "题库",
    component: QuestionsView,
  }, */
  {
    path: '/',
    name: '题库',
    component: QuestionsView,
  },

  {
    path: '/question_submit',
    name: '浏览题目提交',
    component: QuestionSubmitView,
  },
  {
    path: '/view/question/:id',
    name: '在线做题',
    component: ViewQuestionView,
    props: true,
    meta: {
      access: [ACCESS_ENUM.STUDENT, ACCESS_ENUM.TEACHER],
      hideInMenu: true,
    },
  },
  {
    path: '/add/question',
    name: '创建题目',
    component: AddQuestionView,
    meta: {
      access: [ACCESS_ENUM.STUDENT, ACCESS_ENUM.TEACHER],
    },
  },
  {
    path: '/update/question',
    name: '更新题目',
    component: AddQuestionView,
    meta: {
      access: [ACCESS_ENUM.STUDENT, ACCESS_ENUM.TEACHER],
      hideInMenu: true,
    },
  },
  {
    path: '/manage/question/',
    name: '管理题目',
    component: ManageQuestionView,
    meta: {
      access: ACCESS_ENUM.ADMIN,
    },
  },
  {
    path: '/recommend',
    name: '个性化推荐',
    component: RecommendView,
    meta: {
      access: [ACCESS_ENUM.STUDENT, ACCESS_ENUM.TEACHER],
      hideInMenu: true,
    },
  },
  {
    path: '/noAuth',
    name: '无权限',
    component: NoAuthView,
    meta: {
      hideInMenu: true,
    },
  },
  {
    path: '/post/list',
    name: '帖子列表',
    component: PostListView,
  },
  {
    path: '/add/post',
    name: '发布帖子',
    component: AddPostView,
    meta: {
      access: [ACCESS_ENUM.STUDENT, ACCESS_ENUM.TEACHER],
    },
  },
  {
    path: '/update/post',
    name: '更新帖子',
    component: AddPostView,
    meta: {
      access: [ACCESS_ENUM.STUDENT, ACCESS_ENUM.TEACHER],
      hideInMenu: true,
    },
  },
  {
    path: '/view/post/:id',
    name: '帖子详情',
    component: ViewPostView,
    props: true,
    meta: {
      access: [ACCESS_ENUM.STUDENT, ACCESS_ENUM.TEACHER],
      hideInMenu: true,
    },
  },
  {
    path: '/ai/chat',
    name: 'AI聊天',
    component: AiChat,
    meta: {
      access: [ACCESS_ENUM.STUDENT, ACCESS_ENUM.TEACHER],
    },
  },
  {
    path: '/user/center',
    name: '个人中心',
    component: UserCenter,
    meta: {
      access: [ACCESS_ENUM.STUDENT, ACCESS_ENUM.TEACHER],
    },
  },
  // {
  //   path: "/admin",
  //   name: "管理员可见",
  //   component: AdminView,
  //   meta: {
  //     access: ACCESS_ENUM.ADMIN,
  //   },
  // },
  // {
  //   path: "/about",
  //   name: "关于我的",
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () =>
  //     import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
  // },
];
