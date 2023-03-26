import { useState, useEffect } from 'react';
import { Form, ActionPanel, Action, showToast, LocalStorage, Toast, getPreferenceValues, Icon, List, useNavigation } from '@raycast/api';
import fetch from 'node-fetch';
import React from 'react';
import QueneCache from './queue_cache';


var cache: QueneCache = new QueneCache(100, "quque_cache");

interface Preferences {
  apiKey: string;
}


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
  stream: false;
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

type ModelResponse = {
  error: {
    code: string
  }
};


const model: string = 'gpt-3.5-turbo';
// gpt-3.5-turbo
const domain: string = 'https://api.openai.com';
const chatUrl: string = domain + '/v1/chat/completions';
const modelUrl: string = domain + '/v1/models';


function toastContent(title: string, content: string, style: Toast.Style) {
  const options: Toast.Options = {
    style: style,
    title: title,
    message: content,
    primaryAction: {
      title: "Do something",
      onAction: (toast) => {
        toast.hide();
      },
    },
  };
  showToast(options)
}


function createChatRequest(content: string): ChatRequest {
  const realString = "翻译以下内容：\n" + content;
  const message: Message = {
    role: 'user',
    content: realString,
  };
  const chatRequest: ChatRequest = {
    model: model,
    messages: [message],
    stream: false,
  };
  return chatRequest;
}

async function sendRequest(content: string): Promise<string> {
  const apiKey = getApiKey();
  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey || '',
    },
    body: JSON.stringify(createChatRequest(content)),
  });

  const responseBody = await response.text();
  const chatCompletion: ChatCompletion = JSON.parse(responseBody) as ChatCompletion;
  return chatCompletion.choices[0].message.content;
}

function getApiKey(): string {
  const preferences = getPreferenceValues<Preferences>();
  return preferences.apiKey;
}

async function checkApiKey(apiKey: string): Promise<boolean> {
  const response = await fetch(modelUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey || '',
    },
  });
  const responseText = await response.text();
  const modelResponse = JSON.parse(await responseText) as ModelResponse;
  const errorCode = modelResponse?.error?.code; // access the 'code' field of the 'error' object
  return (errorCode != 'invalid_api_key');
}

function HistoryList() {
  const { pop } = useNavigation();
  const items = cache.toArray().map((item) => {
    return (
      <List.Item
        key={item.key}
        title={item.key}
        detail={
          <List.Item.Detail markdown={item.value} />}
      />
    );
  });
  return (
    <List isShowingDetail>
      {items}
    </List>
  );
}

function HistoryAction() {
  return (
    <Action.Push
      icon={Icon.List}
      title="History List"
      target={<HistoryList />}
    />
  );
}

function MainPage() {
  const configuredApiKey = getApiKey();
  const [apiKeyChecked, setApiKeyChecked] = useState<boolean>(false);

  useEffect(() => {
    async function check() {
      toastContent("Checking", "APIKey Checking", Toast.Style.Animated);
      const checked = await checkApiKey(configuredApiKey);
      setApiKeyChecked(checked);
      if (!checked) {
        toastContent("Invalid APIKey", "Please Check Your APIKey In Extension Configuration Page", Toast.Style.Failure);
      } else {
        toastContent("APIKey Checked", "", Toast.Style.Success);
      }
    }
    check();
  }, []);

  const [output, setOutput] = React.useState<string>('');

  async function handleSubmit(values: Values) {
    toastContent("Asking", "", Toast.Style.Animated)
    const res = await sendRequest(values.textarea);
    cache.push(values.textarea.trimStart(), res);
    toastContent("Answered", "", Toast.Style.Success);
    cache.save();
    setOutput(res);
    console.log(cache);
  }


  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} icon={Icon.ArrowRight}/>
          <HistoryAction />
        </ActionPanel>
      }
    >
      <Form.TextArea id="textarea" title="Input" placeholder="Enter multi-line text" />
      <Form.TextArea id="targetarea" title="Output" value={output} onChange={setOutput} placeholder="Enter multi-line text" />
      <Form.Separator />
    </Form>
  );
}

export default function Command() {
  return <MainPage />;
}


