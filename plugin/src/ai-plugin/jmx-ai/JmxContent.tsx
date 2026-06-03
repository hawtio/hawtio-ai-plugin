import { AttributeTable, Chart, JmxContentMBeans, MBeanNode, Operations } from '@hawtio/react'
import {
  Button,
  Content,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelBody,
  DrawerPanelContent,
  EmptyState,
  Nav,
  NavItem,
  NavList,
  PageGroup,
  PageSection,
  Title,
  Toolbar,
  ToolbarItem,
} from '@patternfly/react-core'
import { right } from '@patternfly/react-core/dist/esm/helpers/Popper/thirdparty/popper-core'
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon'
import React, { useContext, useRef } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { DiagnosisChatbot } from './DiagnosisChatbot'
import './JmxContent.css'
import { Attributes } from './attributes'
import { ChatbotContext, MBeanTreeContext, pluginPathWithNodeId, useChatbot } from './context'
import { pluginPath } from './globals'

export const JmxContent: React.FunctionComponent = () => {
  const { selectedNode } = useContext(MBeanTreeContext)
  const { pathname, search } = useLocation()
  const chatbotContext = useChatbot()
  const { isChatbotOpen, setIsChatbotOpen } = chatbotContext
  const drawerRef = useRef<HTMLDivElement>(undefined)

  if (!selectedNode) {
    return (
      <PageSection hasBodyWrapper={false} isFilled>
        <EmptyState headingLevel='h1' icon={CubesIcon} titleText='Select MBean' variant='full' />
      </PageSection>
    )
  }

  const mBeanApplicable = (node: MBeanNode) => Boolean(node.objectName)
  const mBeanCollectionApplicable = (node: MBeanNode) => Boolean(node.children?.every(child => child.objectName))
  const hasAnyApplicableMBean = (node: MBeanNode) =>
    Boolean(node.objectName) || Boolean(node.children?.some(child => child.objectName))

  const tableSelector = (node: MBeanNode) => {
    const tablePriorityList = [
      { condition: mBeanApplicable, element: Attributes },
      { condition: mBeanCollectionApplicable, element: AttributeTable },
    ]

    return tablePriorityList.find(entry => entry.condition(node))?.element ?? JmxContentMBeans
  }

  const allNavItems = [
    { id: 'attributes', title: 'Attributes', component: tableSelector(selectedNode), isApplicable: () => true },
    { id: 'operations', title: 'Operations', component: Operations, isApplicable: mBeanApplicable },
    { id: 'chart', title: 'Chart', component: Chart, isApplicable: hasAnyApplicableMBean },
  ]

  /* Filter the nav items to those applicable to the selected node */
  const navItems = allNavItems.filter(nav => nav.isApplicable(selectedNode))

  const searchWithNid = (pluginPathWithNodeId(selectedNode, new URLSearchParams(search)) as { search: string }).search

  const mbeanNav = (
    <Nav aria-label='MBean Nav' variant='horizontal-subnav'>
      <NavList>
        {navItems.map(nav => (
          <NavItem key={nav.id} isActive={pathname === `${pluginPath}/${nav.id}`}>
            <NavLink to={{ pathname: nav.id, search }}>{nav.title}</NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  )

  const mbeanRoutes = navItems.map(nav => (
    <Route key={nav.id} path={nav.id} element={React.createElement(nav.component)} />
  ))

  const jmxAiToolbar = (
    <Toolbar id='jmx-ai-toolbar' style={{ float: right }}>
      <ToolbarItem>
        <Button variant='secondary' size='sm' onClick={() => setIsChatbotOpen(!isChatbotOpen)}>
          Chat
        </Button>
      </ToolbarItem>
    </Toolbar>
  )

  const jmxContent = (
    <PageGroup id='jmx-content'>
      <PageSection id='jmx-content-header' hasBodyWrapper={false}>
        {jmxAiToolbar}
        <Title headingLevel='h1'>{selectedNode.name}</Title>
        <Content component='small'>{selectedNode.objectName}</Content>
      </PageSection>
      <PageSection type='tabs' hasBodyWrapper={false}>
        {mbeanNav}
      </PageSection>
      <PageSection
        id='jmx-content-main'
        padding={{ default: 'noPadding' }}
        hasOverflowScroll
        aria-label='jmx-content-main'
        hasBodyWrapper={false}
      >
        <Routes>
          {mbeanRoutes}
          <Route
            key='root'
            path='/'
            element={<Navigate to={{ pathname: navItems[0]?.id ?? '', search: searchWithNid }} />}
          />
        </Routes>
      </PageSection>
    </PageGroup>
  )

  const onDrawerExpand = () => {
    drawerRef.current && drawerRef.current.focus()
  }

  const panelContent = (
    <DrawerPanelContent isResizable defaultSize='500px' minSize='200px'>
      <DrawerPanelBody>
        <DiagnosisChatbot />
      </DrawerPanelBody>
    </DrawerPanelContent>
  )

  return (
    <ChatbotContext.Provider value={chatbotContext}>
      <Drawer isExpanded={isChatbotOpen} isInline onExpand={onDrawerExpand}>
        <DrawerContent panelContent={panelContent}>
          <DrawerContentBody>{jmxContent}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </ChatbotContext.Provider>
  )
}
