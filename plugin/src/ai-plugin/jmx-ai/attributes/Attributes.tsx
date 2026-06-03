import { AttributeModal, AttributeValues, HawtioEmptyCard, HawtioLoadingCard } from '@hawtio/react'
import { MessageProps } from '@patternfly/chatbot/dist/esm/Message'
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  Panel,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import { MonitoringIcon } from '@patternfly/react-icons'
import { Table, Tbody, Td, Th, Thead, ThProps, Tr } from '@patternfly/react-table'
import Jolokia, { JolokiaErrorResponse, JolokiaFetchErrorResponse, JolokiaSuccessResponse } from 'jolokia.js'
import React, { useContext, useEffect, useState } from 'react'
import { aiService } from '../../common/ai-service'
import { ChatbotContext, MBeanTreeContext } from '../context'
import { log } from '../globals'
import { jmxAiService } from '../jmx-ai-service'
import { isObject, objectSorter } from '../util'
import { attributeService } from './attribute-service'
import { ThinkInfo, ToolCallsApprove, ToolCallsInfo } from '../DiagnosisChatbot'

export const Attributes: React.FC = () => {
  const { selectedNode } = useContext(MBeanTreeContext)
  const [attributes, setAttributes] = useState<AttributeValues>({})
  const [isReading, setIsReading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState({ name: '', value: '' })
  const [reload, setReload] = useState(false)

  useEffect(() => {
    if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName) {
      return
    }

    setIsReading(true)
    const { objectName } = selectedNode
    attributeService.readWithCallback(objectName, attrs => {
      setAttributes(attrs)
      setIsReading(false)
    })

    attributeService.register(
      { type: 'read', mbean: objectName },
      (response: JolokiaSuccessResponse | JolokiaErrorResponse | JolokiaFetchErrorResponse) => {
        if (response && !Jolokia.isError(response as JolokiaSuccessResponse | JolokiaErrorResponse)) {
          setAttributes((response as JolokiaSuccessResponse).value as AttributeValues)
        }
      },
    )

    return () => attributeService.unregisterAll()
  }, [selectedNode])

  useEffect(() => {
    if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName || !reload) {
      return
    }

    setIsReading(true)
    const { objectName } = selectedNode
    attributeService.readWithCallback(objectName, attrs => {
      setAttributes(attrs)
      setIsReading(false)
    })

    setReload(false)
  }, [selectedNode, reload])

  if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName) {
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  const rows: { name: string; value: string }[] = Object.entries(attributes).map(([name, value]) => ({
    name: name,
    value: isObject(value) ? JSON.stringify(value) : String(value),
  }))

  if (rows.length === 0) {
    return <HawtioEmptyCard message='This MBean has no attributes.' />
  }

  const selectAttribute = (attribute: { name: string; value: string }) => {
    setSelected(attribute)
    if (!isModalOpen) {
      setIsModalOpen(true)
    }
  }

  const getSortParams = (): ThProps['sort'] => ({
    sortBy: {
      index: 0,
      direction: sortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, _index, direction) => {
      setSortDirection(direction)
    },
    columnIndex: 0,
  })

  const panelContent = (
    <AttributeModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onUpdate={() => setReload(true)}
      input={selected}
    />
  )

  const attributesTable = (
    <div id='attribute-table-with-panel'>
      <AiJmxToolbar attributes={attributes} />
      <Table aria-label='Attributes' variant='compact'>
        <Thead>
          <Tr>
            <Th sort={getSortParams()}>Attribute</Th>
            <Th>Value</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows
            .sort((a, b) => objectSorter(a.name, b.name, sortDirection === 'desc'))
            .map((att, index) => (
              <Tr
                key={att.name + '-' + index}
                isClickable
                isRowSelected={selected.name === att.name}
                onRowClick={() => selectAttribute(att)}
              >
                <Td>{att.name}</Td>
                <Td>{att.value}</Td>
              </Tr>
            ))}
        </Tbody>
      </Table>
    </div>
  )

  return (
    <Panel>
      <Drawer isExpanded={isModalOpen} className='pf-m-inline-on-2xl'>
        <DrawerContent panelContent={panelContent}>
          <DrawerContentBody hasPadding>{attributesTable}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </Panel>
  )
}

const AiJmxToolbar: React.FC<{
  attributes: AttributeValues
}> = ({ attributes }) => {
  const { selectedNode } = useContext(MBeanTreeContext)
  //const { username } = useContext(PageContext) // TODO: Unavailable until @hawtio/react 2.3.0
  const username = 'user'
  const { setMessages, setAnnouncement, setIsChatbotOpen } = useContext(ChatbotContext)

  if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName) {
    return null
  }
  const { objectName } = selectedNode

  const diagnose = async () => {
    setIsChatbotOpen(true)
    const attrsValue = JSON.stringify(attributes)
    log.debug('Attributes:', attrsValue)

    const systemMessage = jmxAiService.systemMessage()
    const diagnoseMessage = jmxAiService.diagnoseMessage(objectName, attrsValue)
    const newMessages: MessageProps[] = []
    newMessages.push(aiService.createUserMessage(username, diagnoseMessage))
    newMessages.push(aiService.createLoadingBotMessage())
    setMessages(newMessages)
    setAnnouncement('Diagnosis in progress...')
    log.debug('diagnose - new messages:', newMessages)

    const answer = await aiService.newChat(diagnoseMessage, systemMessage)
    const loadedMessages: MessageProps[] = []
    loadedMessages.push(...newMessages)
    log.debug('diagnose - loaded messages:', loadedMessages)
    // Remove the loading message
    loadedMessages.pop()
    const botMessage = aiService.toBotMessage(answer, ThinkInfo, ToolCallsInfo, ToolCallsApprove)
    loadedMessages.push(botMessage)
    setMessages(loadedMessages)
    setAnnouncement('Diagnosis complete.')
  }

  return (
    <Toolbar id='ai-jmx-toolbar'>
      <ToolbarContent>
        <ToolbarItem>
          <Button variant='primary' size='sm' icon={<MonitoringIcon />} onClick={diagnose}>
            Diagnose
          </Button>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )
}
