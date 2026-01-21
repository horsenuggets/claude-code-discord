import { splitText } from "../discord/utils.ts";
import type { ClaudeMessage } from "./types.ts";
import type { MessageContent, EmbedData, ComponentData } from "../discord/types.ts";

// Discord sender interface for dependency injection
export interface DiscordSender {
  sendMessage(content: MessageContent): Promise<void>;
}

// Store full content for expand functionality
export const expandableContent = new Map<string, string>();

// Helper function to create common action buttons
function createActionButtons(sessionId?: string): ComponentData[] {
  const buttons: ComponentData[] = [];
  
  if (sessionId) {
    buttons.push(
      {
        type: 'button',
        customId: `continue:${sessionId}`,
        label: '➡️ Continue',
        style: 'primary'
      },
      {
        type: 'button',
        customId: `copy-session:${sessionId}`,
        label: '📋 Session ID',
        style: 'secondary'
      },
      {
        type: 'button',
        customId: 'jump-previous',
        label: '⬆️ Jump to Previous',
        style: 'secondary'
      }
    );
  }
  
  buttons.push({
    type: 'button',
    customId: 'cancel-claude',
    label: '❌ Cancel',
    style: 'danger'
  });
  
  return buttons;
}

// Helper function to create workflow buttons  
function createWorkflowButtons(): ComponentData[] {
  return [
    {
      type: 'button',
      customId: 'workflow:git-status',
      label: '📊 Git Status',
      style: 'secondary'
    }
  ];
}

// Helper function to truncate content with smart preview
function truncateContent(content: string, maxLines = 15, maxChars = 1000): { preview: string; isTruncated: boolean; totalLines: number } {
  const lines = content.split('\n');
  const totalLines = lines.length;
  const truncatedLines = lines.slice(0, maxLines);
  const preview = truncatedLines.join('\n');
  
  if (preview.length > maxChars) {
    return {
      preview: preview.substring(0, maxChars - 3) + '...',
      isTruncated: true,
      totalLines
    };
  }
  
  return {
    preview,
    isTruncated: lines.length > maxLines,
    totalLines
  };
}

// Helper function to detect file type from path
function _getFileTypeInfo(filePath: string): { icon: string; language: string } {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  
  const fileTypes: Record<string, { icon: string; language: string }> = {
    'ts': { icon: '📘', language: 'TypeScript' },
    'tsx': { icon: '⚛️', language: 'React/TypeScript' },
    'js': { icon: '📙', language: 'JavaScript' },
    'jsx': { icon: '⚛️', language: 'React/JavaScript' },
    'py': { icon: '🐍', language: 'Python' },
    'rs': { icon: '🦀', language: 'Rust' },
    'go': { icon: '🐹', language: 'Go' },
    'java': { icon: '☕', language: 'Java' },
    'md': { icon: '📝', language: 'Markdown' },
    'json': { icon: '📋', language: 'JSON' },
    'yml': { icon: '⚙️', language: 'YAML' },
    'yaml': { icon: '⚙️', language: 'YAML' },
    'html': { icon: '🌐', language: 'HTML' },
    'css': { icon: '🎨', language: 'CSS' },
    'scss': { icon: '🎨', language: 'SCSS' },
  };
  
  return fileTypes[ext] || { icon: '📄', language: 'Text' };
}

// Tool-specific formatters
function _formatGenericTool(toolName: string, metadata: Record<string, unknown>): { title: string; color: number; description: string } {
  const inputStr = JSON.stringify(metadata.input || {}, null, 2);
  const { preview } = truncateContent(inputStr, 10, 800);
  
  return {
    title: `🔧 Tool Use: ${toolName}`,
    color: 0x0099ff,
    description: `\`\`\`json\n${preview}\n\`\`\``
  };
}

// Create sendClaudeMessages function with dependency injection
export function createClaudeSender(sender: DiscordSender) {
  return async function sendClaudeMessages(messages: ClaudeMessage[]) {
  for (const msg of messages) {
    switch (msg.type) {
      case 'text': {
        const chunks = splitText(msg.content, 4000);
        for (let i = 0; i < chunks.length; i++) {
          await sender.sendMessage({
            embeds: [{
              color: 0x00ff00,
              title: chunks.length > 1 ? `Assistant (${i + 1}/${chunks.length})` : 'Assistant',
              description: chunks[i],
              timestamp: true
            }]
          });
        }
        break;
      }
      
      case 'tool_use': {
        if (msg.metadata?.name === 'TodoWrite') {
          const todos = msg.metadata?.input?.todos || [];
          const statusEmojis: Record<string, string> = {
            pending: '⏳',
            in_progress: '🔄',
            completed: '✅'
          };
          const priorityEmojis: Record<string, string> = {
            high: '🔴',
            medium: '🟡',
            low: '🟢'
          };
          
          let todoList = '';
          if (todos.length === 0) {
            todoList = 'Task list is empty';
          } else {
            for (const todo of todos) {
              const statusEmoji = statusEmojis[todo.status] || '❓';
              const priorityEmoji = priorityEmojis[todo.priority] || '';
              const priorityText = priorityEmoji ? `${priorityEmoji} ` : '';
              todoList += `${statusEmoji} ${priorityText}**${todo.content}**\n`;
            }
          }
          
          await sender.sendMessage({
            embeds: [{
              color: 0x9932cc,
              title: '📝 Todo List Updated',
              description: todoList,
              footer: { text: '⏳ Pending | 🔄 In Progress | ✅ Completed | 🔴 High | 🟡 Medium | 🟢 Low' },
              timestamp: true
            }]
          });
        } else {
          // Use simplified consistent formatting for all tools
          const toolName = msg.metadata?.name || 'Unknown';

          // Special handling for Edit tool to keep "Replacing/With" functionality
          if (toolName === 'Edit') {
            const filePath = msg.metadata.input?.file_path || 'Unknown file';
            const oldString = msg.metadata.input?.old_string || '';
            const newString = msg.metadata.input?.new_string || '';
            
            const fields = [
              { name: '📁 File Path', value: `\`${filePath}\``, inline: false }
            ];
            
            if (oldString) {
              const { preview: oldPreview } = truncateContent(oldString, 3, 150);
              fields.push({ name: '🔴 Replacing', value: `\`\`\`\n${oldPreview}\n\`\`\``, inline: false });
            }
            
            if (newString) {
              const { preview: newPreview } = truncateContent(newString, 3, 150);
              fields.push({ name: '🟢 With', value: `\`\`\`\n${newPreview}\n\`\`\``, inline: false });
            }
            
            await sender.sendMessage({
              embeds: [{
                color: 0xffaa00,
                title: '✏️ Tool Use: Edit',
                fields,
                timestamp: true
              }]
            });
          } else {
            // All other tools use generic consistent formatting
            const inputStr = JSON.stringify(msg.metadata.input || {}, null, 2);
            const { preview, isTruncated } = truncateContent(inputStr, 10, 800);
            
            const messageContent: MessageContent = {
              embeds: [{
                color: 0x0099ff,
                title: `🔧 Tool Use: ${toolName}`,
                description: `\`\`\`json\n${preview}\n\`\`\``,
                timestamp: true
              }]
            };
            
            // Add expand button if content was truncated
            if (isTruncated) {
              const expandId = `tool-${msg.metadata?.id || Date.now()}`;
              expandableContent.set(expandId, inputStr);
              
              messageContent.components = [{
                type: 'actionRow',
                components: [{
                  type: 'button',
                  customId: `expand:${expandId}`,
                  label: '📖 Show Full Content',
                  style: 'secondary'
                }]
              }];
            }
            
            await sender.sendMessage(messageContent);
          }
        }
        break;
      }
      
      case 'tool_result': {
        // Filter out system reminder content
        let cleanContent = msg.content;
        
        // Remove system reminder blocks
        cleanContent = cleanContent.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
        
        // Remove any remaining empty lines or extra whitespace
        cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
        
        if (!cleanContent) {
          // If no content left after filtering, don't show the tool result
          break;
        }
        
        const { preview, isTruncated, totalLines } = truncateContent(cleanContent);
        
        const messageContent: MessageContent = {
          embeds: [{
            color: 0x00ffff,
            title: `✅ Tool Result${isTruncated ? ` (+${totalLines - 15} more lines)` : ''}`,
            description: `\`\`\`\n${preview}\n\`\`\``,
            timestamp: true
          }]
        };
        
        // Add expand button if content was truncated
        if (isTruncated) {
          const expandId = `result-${Date.now()}`;
          expandableContent.set(expandId, cleanContent);
          
          messageContent.components = [{
            type: 'actionRow',
            components: [{
              type: 'button',
              customId: `expand:${expandId}`,
              label: '📖 Show Full Result',
              style: 'secondary'
            }]
          }];
        }
        
        await sender.sendMessage(messageContent);
        break;
      }
      
      case 'thinking': {
        const chunks = splitText(msg.content, 4000);
        for (let i = 0; i < chunks.length; i++) {
          await sender.sendMessage({
            embeds: [{
              color: 0x9b59b6,
              title: chunks.length > 1 ? `💭 Thinking (${i + 1}/${chunks.length})` : '💭 Thinking',
              description: chunks[i],
              timestamp: true
            }]
          });
        }
        break;
      }
      
      case 'system': {
        const embedData: EmbedData = {
          color: msg.metadata?.subtype === 'completion' ? 0x00ff00 : 0xaaaaaa,
          title: msg.metadata?.subtype === 'completion' ? '✅ Claude Code Complete' : `⚙️ System: ${msg.metadata?.subtype || 'info'}`,
          timestamp: true,
          fields: []
        };
        
        if (msg.metadata?.cwd) {
          embedData.fields!.push({ name: 'Working Directory', value: `\`${msg.metadata.cwd}\``, inline: false });
        }
        if (msg.metadata?.session_id) {
          embedData.fields!.push({ name: 'Session ID', value: `\`${msg.metadata.session_id}\``, inline: false });
        }
        if (msg.metadata?.model) {
          embedData.fields!.push({ name: 'Model', value: msg.metadata.model, inline: true });
        }
        if (msg.metadata?.total_cost_usd !== undefined) {
          embedData.fields!.push({ name: 'Cost', value: `$${msg.metadata.total_cost_usd.toFixed(4)}`, inline: true });
        }
        if (msg.metadata?.duration_ms !== undefined) {
          embedData.fields!.push({ name: 'Duration', value: `${(msg.metadata.duration_ms / 1000).toFixed(2)}s`, inline: true });
        }
        
        // Special handling for shutdown
        if (msg.metadata?.subtype === 'shutdown') {
          embedData.color = 0xff0000;
          embedData.title = '🛑 Shutdown';
          embedData.description = `Bot stopped by signal ${msg.metadata.signal}`;
          embedData.fields = [
            { name: 'Category', value: msg.metadata.categoryName, inline: true },
            { name: 'Repository', value: msg.metadata.repoName, inline: true },
            { name: 'Branch', value: msg.metadata.branchName, inline: true }
          ];
        }
        
        // Add interactive buttons for completed sessions (but not shutdown messages)
        const messageContent: MessageContent = { embeds: [embedData] };
        
        if (msg.metadata?.subtype === 'completion' && msg.metadata?.session_id) {
          const actionButtons = createActionButtons(msg.metadata.session_id);
          const workflowButtons = createWorkflowButtons();
          
          messageContent.components = [
            { type: 'actionRow', components: actionButtons },
            { type: 'actionRow', components: workflowButtons }
          ];
        }
        
        await sender.sendMessage(messageContent);
        break;
      }
      
      case 'other': {
        const jsonStr = JSON.stringify(msg.metadata || msg.content, null, 2);
        // Account for code block markers when splitting
        const maxChunkLength = 4096 - "```json\n\n```".length - 50; // 50 chars safety margin
        const chunks = splitText(jsonStr, maxChunkLength);
        for (let i = 0; i < chunks.length; i++) {
          await sender.sendMessage({
            embeds: [{
              color: 0xffaa00,
              title: chunks.length > 1 ? `Other Content (${i + 1}/${chunks.length})` : 'Other Content',
              description: `\`\`\`json\n${chunks[i]}\n\`\`\``,
              timestamp: true
            }]
          });
        }
        break;
      }
    }
  }
  };
}