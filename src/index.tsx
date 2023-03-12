import { useState, useEffect } from 'react';
import { Form, ActionPanel, Action, showToast, LocalStorage } from '@raycast/api';
import fetch from 'node-fetch';
import React from 'react';
import { pseudoRandomBytes } from 'crypto';

type Values = {
  textarea: string;
};

type Message = {
  role: string;
  content: string;
};

type ChatRequest = {
  model: string;
  messages: Message[];
};


type ChatCompletion = {
  id: string;
  object: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

const model: string = 'gpt-3.5-turbo';

function createChatRequest(content: string): ChatRequest {
  const realString = "翻译以下内容：\n" + content;
  const message: Message = {
    role: 'user',
    content: realString,
  };
  const chatRequest: ChatRequest = {
    model: model,
    messages: [message],
  };
  return chatRequest;
}

async function sendRequest(content: string): Promise<string> {
  const apiKey = await LocalStorage.getItem<string>('api-key');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey || '',
    },
    body: JSON.stringify(createChatRequest(content)),
  });
  
  // console.log('apiKey:', apiKey);
  const responseBody = await response.text();
  const chatCompletion: ChatCompletion = JSON.parse(responseBody) as ChatCompletion;
  return chatCompletion.choices[0].message.content;
}

function useApiKey(): string {
  const [apiKey, setApiKey] = useState<string>('');
  useEffect(() => {
    async function fetchApiKey() {
      const storedApiKey = await LocalStorage.getItem<string>('api-key');
      if (storedApiKey) {
        setApiKey(storedApiKey);
      }
    }

    fetchApiKey();
  }, []);

  return apiKey;
}

function ConfigPage() {
  function handleSubmit(values: { textfield: string }) {
    LocalStorage.setItem('api-key', values.textfield);
    window.location.reload();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="textfield" title="Api-Key" placeholder="Enter your Api-Key" />
    </Form>
  );
}

function UsePage() {
  const [output, setOutput] = React.useState<string>('');
  async function handleSubmit(values: Values) {
    console.log(values);
    const res = await sendRequest(values.textarea);
    setOutput(res);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="textarea" title="Input" placeholder="Enter multi-line text" />
      <Form.TextArea id="targetarea" title="Output" value={output} onChange={setOutput} placeholder="Enter multi-line text" />
      <Form.Separator />
      <Form.Dropdown id="dropdown" title="Dropdown">
        <Form.Dropdown.Item value="zh-en" title="中->英" />
        <Form.Dropdown.Item value="en-zh" title="英->中" />
      </Form.Dropdown>
    </Form>
  );
}

function RefreshPage() {
  const apiKey = useApiKey();

  if (!apiKey) {
    return <ConfigPage />;
  }

  console.log('test');
  return <UsePage />;
}

export default function Command() {
  return <RefreshPage />;
}
