import DeleteIcon from "../icons/delete.svg";
import PinIcon from "../icons/pin.svg";
import ShareIcon from "../icons/share.svg";
import RenameIcon from "../icons/rename.svg";
import MoreIcon from "../icons/more.svg";
import ChatIcon from "../icons/chat.svg";
import ChevronDownIcon from "../icons/down.svg";

import styles from "./chat-list.module.scss";
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { createPortal } from "react-dom";

import { useChatStore } from "../store";
import { DEFAULT_TOPIC } from "../store/chat";

import Locale from "../locales";
import { useLocation, useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { MaskAvatar } from "./mask";
import { Mask } from "../store/mask";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { showConfirm, showPrompt } from "./ui-lib";
import { useMobileScreen, getMessageTextContent } from "../utils";
import { ChatSession } from "../store/chat";

export type TimeGroup =
  | "pinned"
  | "today"
  | "last7days"
  | "thisMonth"
  | "earlier";

export function getTimeGroup(lastUpdate: number): Exclude<TimeGroup, "pinned"> {
  const now = new Date();
  const date = new Date(lastUpdate);

  // 今天
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return "today";
  }

  // 最近 7 天
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  if (lastUpdate >= sevenDaysAgo) {
    return "last7days";
  }

  // 本月内
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  ) {
    return "thisMonth";
  }

  // 更多
  return "earlier";
}

const GROUP_ORDER: TimeGroup[] = [
  "pinned",
  "today",
  "last7days",
  "thisMonth",
  "earlier",
];

function getGroupLabel(type: TimeGroup): string {
  switch (type) {
    case "pinned":
      return Locale.ChatItem.Group.Pinned;
    case "today":
      return Locale.ChatItem.Group.Today;
    case "last7days":
      return Locale.ChatItem.Group.Last7Days;
    case "thisMonth":
      return Locale.ChatItem.Group.ThisMonth;
    case "earlier":
      return Locale.ChatItem.Group.Earlier;
  }
}

function SectionHeader(props: {
  label: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={styles["chat-group-header"]}
      onClick={props.onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          props.onToggle();
        }
      }}
      role="button"
      aria-expanded={!props.collapsed}
      tabIndex={0}
    >
      <div className={styles["chat-group-header-title"]}>
        <ChevronDownIcon
          className={`${styles["chat-group-header-icon"]} ${
            props.collapsed ? styles["collapsed"] : ""
          }`}
        />
        <span>{props.label}</span>
      </div>
      <span className={styles["chat-group-header-count"]}>{props.count}</span>
    </div>
  );
}

function ChatItemDropdown(props: {
  onShare?: () => void;
  onRename?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onDelete?: () => void;
  onNewChatWithMask?: () => void;
  hasMask?: boolean;
  pinned?: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  position: { top: number; left: number };
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        props.onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [props.onClose]);

  const menuItems = [
    ...(props.hasMask
      ? [
          {
            icon: <ChatIcon />,
            label: Locale.ChatItem.Actions.NewChatWithMask,
            onClick: props.onNewChatWithMask,
          },
        ]
      : []),
    {
      icon: <ShareIcon />,
      label: Locale.ChatItem.Actions.Share,
      onClick: props.onShare,
    },
    {
      icon: <RenameIcon />,
      label: Locale.ChatItem.Actions.Rename,
      onClick: props.onRename,
    },
    {
      icon: <PinIcon />,
      label: props.pinned
        ? Locale.ChatItem.Actions.Unpin
        : Locale.ChatItem.Actions.Pin,
      onClick: props.pinned ? props.onUnpin : props.onPin,
    },
    {
      icon: <DeleteIcon />,
      label: Locale.ChatItem.Actions.Delete,
      onClick: props.onDelete,
      danger: true,
    },
  ];

  return createPortal(
    <div
      ref={dropdownRef}
      className={styles["chat-item-dropdown"]}
      style={{
        top: props.position.top,
        left: props.position.left,
      }}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      {menuItems.map((item, index) => (
        <div
          key={index}
          className={`${styles["chat-item-dropdown-item"]} ${
            item.danger ? styles["danger"] : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            item.onClick?.();
            props.onClose();
          }}
        >
          <span className={styles["chat-item-dropdown-icon"]}>{item.icon}</span>
          <span className={styles["chat-item-dropdown-label"]}>
            {item.label}
          </span>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onShare?: () => void;
  onRename?: () => void;
  onNewChatWithMask?: () => void;
  hasMask?: boolean;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
  pinned?: boolean;
}) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLDivElement | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const isHoveringRef = useRef({ button: false, dropdown: false });
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (props.selected && draggableRef.current) {
      draggableRef.current?.scrollIntoView({
        block: "center",
      });
    }
  }, [props.selected]);

  const { pathname: currentPath } = useLocation();

  const checkAndCloseDropdown = () => {
    setTimeout(() => {
      if (!isHoveringRef.current.button && !isHoveringRef.current.dropdown) {
        setShowDropdown(false);
      }
    }, 100);
  };

  const handleMoreMouseEnter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isHoveringRef.current.button = true;
    if (moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setShowDropdown(true);
  };

  const handleMoreMouseLeave = () => {
    isHoveringRef.current.button = false;
    checkAndCloseDropdown();
  };

  const handleDropdownMouseEnter = () => {
    isHoveringRef.current.dropdown = true;
  };

  const handleDropdownMouseLeave = () => {
    isHoveringRef.current.dropdown = false;
    checkAndCloseDropdown();
  };

  // 解析 [角色] 标题 → 只显示标题；角色会话用样式区分
  const displayTitle = (() => {
    if (!props.hasMask) return props.title;
    const match = props.title.match(/^\[([^\]]+)\]\s+(.+)$/);
    return match ? match[2] : props.title;
  })();

  const roleName = (() => {
    if (!props.hasMask) return "";
    const match = props.title.match(/^\[([^\]]+)\]\s+(.+)$/);
    return match ? match[1] : "";
  })();

  return (
    <>
      <Draggable draggableId={`${props.id}`} index={props.index}>
        {(provided) => (
          <div
            className={`${styles["chat-item"]} ${
              props.selected &&
              (currentPath === Path.Chat || currentPath === Path.Home) &&
              styles["chat-item-selected"]
            } ${props.pinned ? styles["chat-item-pinned"] : ""} ${
              props.narrow ? styles["chat-item-narrow-mode"] : ""
            } ${props.hasMask ? styles["chat-item-has-mask"] : ""}`}
            onClick={props.onClick}
            ref={(ele) => {
              draggableRef.current = ele;
              provided.innerRef(ele);
            }}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onMouseEnter={() => {
              clearTimeout(tooltipTimerRef.current);
              tooltipTimerRef.current = setTimeout(
                () => setShowTooltip(true),
                300,
              );
            }}
            onMouseLeave={() => {
              clearTimeout(tooltipTimerRef.current);
              setShowTooltip(false);
            }}
          >
            {props.narrow ? (
              <div className={styles["chat-item-narrow"]}>
                <div className={styles["chat-item-avatar"] + " no-dark"}>
                  <MaskAvatar
                    avatar={props.mask.avatar}
                    model={props.mask.modelConfig.model}
                  />
                </div>
                <div className={styles["chat-item-narrow-count"]}>
                  {props.count}
                </div>
              </div>
            ) : (
              <>
                <div className={styles["chat-item-title"]}>{displayTitle}</div>
              </>
            )}

            {/* 右侧操作区域：置顶图标 / 更多按钮 */}
            <div
              className={`${styles["chat-item-actions"]} ${
                props.narrow ? styles["chat-item-actions-narrow"] : ""
              }`}
            >
              {/* 置顶图标：仅在置顶且未 hover 时显示 */}
              {props.pinned && (
                <div className={styles["chat-item-pin-indicator"]}>
                  <PinIcon />
                </div>
              )}
              {/* 更多按钮：hover 时显示 */}
              <div
                ref={moreButtonRef}
                className={styles["chat-item-more"]}
                onMouseEnter={handleMoreMouseEnter}
                onMouseLeave={handleMoreMouseLeave}
              >
                <MoreIcon />
              </div>
              {/* 下拉菜单 */}
              {showDropdown && (
                <ChatItemDropdown
                  onShare={props.onShare}
                  onRename={props.onRename}
                  onPin={props.onPin}
                  onUnpin={props.onUnpin}
                  onDelete={props.onDelete}
                  onNewChatWithMask={props.onNewChatWithMask}
                  hasMask={props.hasMask}
                  pinned={props.pinned}
                  onClose={() => setShowDropdown(false)}
                  onMouseEnter={handleDropdownMouseEnter}
                  onMouseLeave={handleDropdownMouseLeave}
                  position={dropdownPosition}
                />
              )}
            </div>
          </div>
        )}
      </Draggable>
      {showTooltip &&
        !props.narrow &&
        draggableRef.current &&
        createPortal(
          <div
            className={styles["chat-item-tooltip"]}
            style={(() => {
              const rect = draggableRef.current!.getBoundingClientRect();
              return {
                bottom: window.innerHeight - rect.top + 6,
                left: rect.left + rect.width / 2,
              };
            })()}
          >
            <div>{displayTitle}</div>
            {roleName && (
              <div>
                {Locale.ChatItem.Group.Role}：{roleName}
              </div>
            )}
            <div>{Locale.ChatItem.ChatItemCount(props.count)}</div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function ChatList(props: { narrow?: boolean }) {
  const [
    sessions,
    selectedIndex,
    selectSession,
    moveSession,
    pinSession,
    unpinSession,
  ] = useChatStore((state) => [
    state.sessions,
    state.currentSessionIndex,
    state.selectSession,
    state.moveSession,
    state.pinSession,
    state.unpinSession,
  ]);
  const chatStore = useChatStore();
  const navigate = useNavigate();
  const isMobileScreen = useMobileScreen();

  const sortedSessions = sessions.slice().sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.lastUpdate - a.lastUpdate;
  });

  const [collapsedGroups, setCollapsedGroups] = useState<Set<TimeGroup>>(
    () => new Set(),
  );

  const toggleGroup = useCallback((type: TimeGroup) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const groups = useMemo(() => {
    const groupMap = new Map<TimeGroup, ChatSession[]>();
    for (const groupType of GROUP_ORDER) {
      groupMap.set(groupType, []);
    }
    for (const session of sortedSessions) {
      if (session.pinned) {
        groupMap.get("pinned")!.push(session);
      } else {
        const group = getTimeGroup(session.lastUpdate);
        groupMap.get(group)!.push(session);
      }
    }
    return GROUP_ORDER.map((type) => ({
      type,
      label: getGroupLabel(type),
      sessions: groupMap.get(type)!,
    })).filter((group) => group.sessions.length > 0);
  }, [sortedSessions]);

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveSession(source.index, destination.index);
  };

  const allCollapsed =
    groups.length > 0 && groups.every((g) => collapsedGroups.has(g.type));

  return (
    <>
      {!props.narrow && groups.length > 0 && (
        <div className={styles["chat-group-toggle"]}>
          <span
            onClick={() => {
              if (allCollapsed) {
                setCollapsedGroups(new Set());
              } else {
                setCollapsedGroups(new Set(groups.map((g) => g.type)));
              }
            }}
          >
            {allCollapsed
              ? Locale.ChatItem.Group.ExpandAll
              : Locale.ChatItem.Group.CollapseAll}
          </span>
        </div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="chat-list">
          {(provided) => (
            <div
              className={styles["chat-list"]}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {(() => {
                let sequentialIndex = 0;
                return groups.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.type);
                  return (
                    <div key={group.type} className={styles["chat-group"]}>
                      {!props.narrow && (
                        <SectionHeader
                          label={group.label}
                          count={group.sessions.length}
                          collapsed={isCollapsed}
                          onToggle={() => toggleGroup(group.type)}
                        />
                      )}
                      {!isCollapsed &&
                        group.sessions.map((item) => {
                          const idx = sequentialIndex++;
                          return (
                            <ChatItem
                              title={item.topic}
                              time={new Date(item.lastUpdate).toLocaleString()}
                              count={item.messages.length}
                              key={item.id}
                              id={item.id}
                              index={idx}
                              selected={
                                sessions.indexOf(item) === selectedIndex
                              }
                              pinned={item.pinned}
                              onClick={() => {
                                navigate(Path.Chat);
                                selectSession(sessions.indexOf(item));
                              }}
                              onDelete={async () => {
                                const lastMessage =
                                  item.messages[item.messages.length - 1];
                                const summary = lastMessage
                                  ? getMessageTextContent(lastMessage).slice(
                                      0,
                                      50,
                                    ) +
                                    (getMessageTextContent(lastMessage).length >
                                    50
                                      ? "..."
                                      : "")
                                  : "";

                                const confirmContent = (
                                  <div style={{ textAlign: "left" }}>
                                    <div style={{ marginBottom: "10px" }}>
                                      {Locale.ChatItem.DeleteConfirm.Title}
                                    </div>
                                    <div style={{ marginBottom: "6px" }}>
                                      <span
                                        style={{
                                          color: "var(--black)",
                                          fontWeight: 500,
                                          fontSize: "var(--text-sm)",
                                        }}
                                      >
                                        {item.topic}
                                      </span>
                                      <span
                                        style={{
                                          color: "rgb(150, 150, 150)",
                                          marginLeft: "6px",
                                          fontSize: "var(--text-xs)",
                                        }}
                                      >
                                        (
                                        {Locale.ChatItem.ChatItemCount(
                                          item.messages.length,
                                        )}
                                        )
                                      </span>
                                    </div>
                                    {summary && (
                                      <div
                                        style={{
                                          color: "rgb(150, 150, 150)",
                                          fontSize: "var(--text-xs)",
                                        }}
                                      >
                                        <span>
                                          {
                                            Locale.ChatItem.DeleteConfirm
                                              .LastMessage
                                          }
                                        </span>
                                        <span
                                          style={{
                                            marginLeft: "4px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {summary}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );

                                if (await showConfirm(confirmContent)) {
                                  chatStore.deleteSession(
                                    sessions.indexOf(item),
                                  );
                                }
                              }}
                              onPin={() => {
                                pinSession(sessions.indexOf(item));
                              }}
                              onUnpin={() => {
                                unpinSession(sessions.indexOf(item));
                              }}
                              onShare={() => {
                                selectSession(sessions.indexOf(item));
                                navigate(Path.Chat, {
                                  state: { triggerShare: true },
                                });
                              }}
                              onRename={async () => {
                                const newTopic = await showPrompt(
                                  Locale.Chat.Rename,
                                  item.topic,
                                  1,
                                );
                                if (newTopic && newTopic.trim()) {
                                  chatStore.updateSession(
                                    sessions.indexOf(item),
                                    (session) => {
                                      session.topic = newTopic.trim();
                                    },
                                  );
                                }
                              }}
                              onNewChatWithMask={() => {
                                chatStore.newSession(item.mask);
                                navigate(Path.Chat);
                              }}
                              hasMask={
                                !!item.mask?.name &&
                                item.mask.name !== DEFAULT_TOPIC
                              }
                              narrow={props.narrow}
                              mask={item.mask}
                            />
                          );
                        })}
                    </div>
                  );
                });
              })()}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}
