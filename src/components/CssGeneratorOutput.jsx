import React from 'react'
import { Button, Card, Tabs } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

export default function CssGeneratorOutput({
  title,
  outputTabs,
  children,
  copyValue,
  tabsCopyValue,
  copy,
  copyLabel,
}) {
  return (
    <Card
      title={title}
      extra={
        <Button size="small" icon={<CopyOutlined />} onClick={() => copy(copyValue)}>
          {copyLabel}
        </Button>
      }
    >
      {outputTabs ? (
        <Tabs
          items={outputTabs}
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
