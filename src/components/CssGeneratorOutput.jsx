import React from 'react'
import { Button, Card, Tabs } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

export default function CssGeneratorOutput({
  title,
  outputTabs,
  tabs,
  children,
  copyValue,
  tabsCopyValue,
  copy,
  copyLabel,
}) {
  const tabItems = tabs
    ? tabs.map((tab) => ({
        key: tab.key,
        label: tab.label,
        children: (
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            <code>{tab.value}</code>
          </pre>
        ),
      }))
    : outputTabs

  return (
    <Card
      title={title}
      extra={
        <Button size="small" icon={<CopyOutlined />} onClick={() => copy(copyValue)}>
          {copyLabel}
        </Button>
      }
    >
      {tabItems ? (
        <Tabs
          items={tabItems}
          tabBarExtraContent={
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(tabsCopyValue)}>
              {copyLabel}
            </Button>
          }
        />
      ) : (
        children
      )}
    </Card>
  )
}
