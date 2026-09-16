import type { AnnouncementConfig } from "@/types/announcementConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 公告栏配置
 * 组件显示由 sidebarConfig 统一控制
 */
export const announcementConfig: AnnouncementConfig = withUserConfig(
	"announcement",
	{
  title: "声明",
  content: "本站内容均为个人学习笔记，转载请注明出处。",
  closable: false,
  link: { enable: false, text: "", url: "", external: false },
},
);
