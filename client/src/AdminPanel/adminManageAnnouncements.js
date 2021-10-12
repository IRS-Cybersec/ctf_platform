import React from 'react';
import { Layout, Menu, Table, message, Dropdown, Button, Space, Modal, Form, Input, Card } from 'antd';
import {
    FileUnknownTwoTone,
    ExclamationCircleOutlined,
    DeleteOutlined,
    ClusterOutlined,
    RedoOutlined,
    NotificationOutlined,
    SearchOutlined
} from '@ant-design/icons';
import orderBy from 'lodash.orderby';
import { Ellipsis } from 'react-spinners-css';
const MDEditor = React.lazy(() => import("@uiw/react-md-editor"));
const MarkdownRender = React.lazy(() => import('./../Misc/MarkdownRenderer.js'));

const { Column } = Table;
const { confirm } = Modal;


const CreateAnnouncementsForm = (props) => {
    const [form] = Form.useForm();
    const [editorValue, setEditorValue] = React.useState("")

    return (
        <Form
            form={form}
            name="announcements_creation_form"
            className="announcements_creation_form"
            onFinish={(values) => {
                setEditorValue("")
                form.resetFields()
                props.createAnnouncement(values)

            }}
        >
            <h3>Title</h3>
            <Form.Item
                name="title"
                rules={[{ required: true, message: 'Please enter the title' }]}
            >
                <Input allowClear placeholder="Enter the announcement title" />
            </Form.Item>

            <h3>Content <span>(Supports Markdown)</span></h3>
            <Form.Item
                name="content"
                rules={[
                    { required: true, message: 'Please enter the content' },]}
                valuePropName={editorValue}
            >
                <MDEditor value={editorValue} onChange={(value) => { setEditorValue(value) }} preview="edit" />

            </Form.Item>

            <h3>Preview</h3>
            <Card

                hoverable
                type="inner"
                bordered={true}
                bodyStyle={{ backgroundColor: "#262626" }}
                style={{ overflow: "hidden", marginBottom: "3ch" }}
            >
                <MarkdownRender>{editorValue}</MarkdownRender>
                <span style={{ float: "right" }}>Posted on <i>Post Date</i></span>
            </Card>


            <Form.Item>
                <Button style={{ marginRight: "1.5vw" }} onClick={() => { props.setState({ createAnnouncementsModal: false }) }}>Cancel</Button>
                <Button type="primary" htmlType="submit" style={{ marginBottom: "1.5vh" }} loading={props.state.modalLoading}>Create Announcement</Button>
            </Form.Item>
        </Form>
    );
};

const EditAnnouncementsForm = (props) => {
    const [form] = Form.useForm();
    const [editorValue, setEditorValue] = React.useState("")

    if (typeof form.getFieldValue("title") === "undefined") {
        form.setFieldsValue(props.initialData.data)
        setEditorValue(props.initialData.data.content)
    }


    return (
        <Form
            form={form}
            name="announcements_edit_form"
            className="announcements_edit_form"
            onFinish={(values) => {
                setEditorValue("")
                form.resetFields()
                props.editAnnouncement(values, props.initialData.id)
            }}
        >
            <h3>Title</h3>
            <Form.Item
                name="title"
                rules={[{ required: true, message: 'Please enter the title' }]}
            >
                <Input allowClear placeholder="Enter the announcement title" />
            </Form.Item>

            <h3>Content <span>(Supports Markdown)</span></h3>
            <Form.Item
                name="content"
                rules={[
                    { required: true, message: 'Please enter the content' },]}
                valuePropName={editorValue}
            >
                <MDEditor value={editorValue} onChange={(value) => { setEditorValue(value) }} preview="edit" />

            </Form.Item>

            <h3>Preview</h3>
            <Card

                hoverable
                type="inner"
                bordered={true}
                bodyStyle={{ backgroundColor: "#262626" }}
                style={{ overflow: "hidden", marginBottom: "3ch" }}
            >
                <MarkdownRender>{editorValue}</MarkdownRender>
                <span style={{ float: "right" }}>Posted on <i>{new Date(props.initialData.data.timestamp).toLocaleString("en-US", { timeZone: "Asia/Singapore" })}</i></span>
            </Card>


            <Form.Item>
                <Button style={{ marginRight: "1.5vw" }} onClick={() => { props.setState({ editAnnouncementsModal: false }) }}>Cancel</Button>
                <Button type="primary" htmlType="submit" style={{ marginBottom: "1.5vh" }} loading={props.state.modalLoading}>Edit Announcement</Button>
            </Form.Item>
        </Form>
    );
};


class AdminManageAnnouncements extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            dataSource: [],
            createAnnouncementsModal: false,
            editAnnouncementsModal: false,
            modalLoading: false,
            initialData: null,
            disableEditButtons: true,
            selectedTableKeys: []
        }
    }

    componentDidMount() {
        this.fillTableData()
    }

    fillTableData = async () => {
        this.setState({ loading: true })
        await fetch(window.ipAddress + "/v1/announcements/list/-1", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken},
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                for (let i = 0; i < data.data.length; i++) {
                    data.data[i].key = data.data[i]._id
                }
                this.setState({ dataSource: orderBy(data.data, ['timestamp'], ["desc"]), loading: false })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    createAnnouncement = async (values) => {
        this.setState({ modalLoading: true })
        await fetch(window.ipAddress + "/v1/announcements/create", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken},
            body: JSON.stringify({
                "title": values.title,
                "content": values.content,
            })
        }).then((results) => {
            //console.log(results)
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "Created announcement successfully!" })
                this.setState({ createAnnouncementsModal: false })
                this.fillTableData()
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }



        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        this.setState({ modalLoading: false })

    }

    deleteAnnouncement = async (close, ids) => {
        this.setState({ disableEditButtons: true })
        await fetch(window.ipAddress + "/v1/announcements/delete", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken},
            body: JSON.stringify({
                "ids": ids
            })
        }).then((results) => {
            //console.log(results)
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "Deleted announcements [" + ids.join(', ') + "] successfully!" })
                this.fillTableData()
                this.setState({ selectedTableKeys: [] })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        close()
    }

    editAnnouncementOpen = (id) => {
        fetch(window.ipAddress + "/v1/announcements/get/" + id.toString(), {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken},
        }).then((results) => {
            //console.log(results)
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            console.log(data)
            if (data.success === true) {
                this.setState({ initialData: { id: id, data: data.data }, editAnnouncementsModal: true })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    editAnnouncement = async (values, id) => {
        this.setState({ modalLoading: true })
        await fetch(window.ipAddress + "/v1/announcements/edit", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken},
            body: JSON.stringify({
                "id": id,
                "title": values.title,
                "content": values.content,
            })
        }).then((results) => {
            //console.log(results)
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                message.success({ content: "Edited announcement successfully!" })
                this.setState({ editAnnouncementsModal: false, initialData: null })
                this.fillTableData()
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })

        this.setState({ modalLoading: false })

    }

    handleTableSelect = (selectedRowKeys) => {
        this.setState({ selectedTableKeys: selectedRowKeys })
        if (this.state.disableEditButtons && selectedRowKeys.length > 0) this.setState({ disableEditButtons: false })
        else if (!this.state.disableEditButtons && selectedRowKeys.length === 0) this.setState({ disableEditButtons: true })

    }







    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>

                <Modal
                    title="Create New Announcement"
                    visible={this.state.createAnnouncementsModal}
                    footer={null}
                    onCancel={() => { this.setState({ createAnnouncementsModal: false }) }}
                >

                    <CreateAnnouncementsForm createAnnouncement={this.createAnnouncement.bind(this)} setState={this.setState.bind(this)} state={this.state} />
                </Modal>

                <Modal
                    title="Edit Announcement"
                    visible={this.state.editAnnouncementsModal}
                    footer={null}
                    onCancel={() => { this.setState({ editAnnouncementsModal: false }) }}
                    destroyOnClose
                >

                    <EditAnnouncementsForm editAnnouncement={this.editAnnouncement.bind(this)} setState={this.setState.bind(this)} state={this.state} initialData={this.state.initialData} />
                </Modal>


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", height: "2ch" }}>
                        <Button type="primary" style={{ marginBottom: "2vh", marginRight: "1ch" }} icon={<NotificationOutlined />} onClick={() => { this.setState({ createAnnouncementsModal: true }) }}>Create New Announcement</Button>
                        {this.state.loading && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <Ellipsis color="#177ddc" size={60} />
                                <h1>Loading Announcements</h1>
                            </div>
                        )}
                    </div>
                    <Button loading={this.state.loading} type="primary" shape="circle" size="large" style={{ marginBottom: "2vh" }} icon={<RedoOutlined />} onClick={async () => { await this.fillTableData(); message.success("Announcements list refreshed.") }} />
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <Button disabled={this.state.disableEditButtons} style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#a61d24" }} icon={<DeleteOutlined />} onClick={() => {
                        confirm({
                            confirmLoading: this.state.disableEditButtons,
                            title: 'Are you sure you want to delete the announcement(s) [' + this.state.selectedTableKeys.join(", ") + ']? This action is irreversible.',
                            icon: <ExclamationCircleOutlined />,
                            onOk: (close) => { this.deleteAnnouncement(close.bind(this), this.state.selectedTableKeys) },
                            onCancel: () => { },
                        });
                    }}>Delete Announcements</Button>
                </div>
                <Table rowSelection={{ selectedRowKeys: this.state.selectedTableKeys, onChange: this.handleTableSelect.bind(this) }} style={{ overflow: "auto" }} dataSource={this.state.dataSource} locale={{
                    emptyText: (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                            <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                            <h1 style={{ fontSize: "200%" }}>No announcements have been created.</h1>
                        </div>
                    )
                }}>
                    <Column title="Announcement ID" dataIndex="_id" key="_id" />
                    <Column title="Title" dataIndex="title" key="title"
                        filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                            <div style={{ padding: 8 }}>
                                <Input
                                    placeholder="Search Title"
                                    value={selectedKeys[0]}
                                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                    onPressEnter={() => confirm()}
                                    style={{ marginBottom: 8, display: 'block' }}
                                />
                                <Space>
                                    <Button
                                        type="primary"
                                        onClick={() => { confirm() }}
                                        icon={<SearchOutlined />}
                                    >
                                        Search
                                    </Button>
                                    <Button onClick={() => clearFilters()}>
                                        Reset
                                    </Button>
                                </Space>
                            </div>
                        )}
                        onFilter={(value, record) => record.title.includes(value.toLowerCase())}
                        filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />} />
                    <Column title="Content" dataIndex="content" key="content"
                        render={(text, row, index) => {
                            if (text.length > 25) return text.slice(0, 25) + "..."
                            else return text
                        }}
                        filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                            <div style={{ padding: 8 }}>
                                <Input
                                    placeholder="Search Content"
                                    value={selectedKeys[0]}
                                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                    onPressEnter={() => confirm()}
                                    style={{ marginBottom: 8, display: 'block' }}
                                />
                                <Space>
                                    <Button
                                        type="primary"
                                        onClick={() => { confirm() }}
                                        icon={<SearchOutlined />}
                                    >
                                        Search
                                    </Button>
                                    <Button onClick={() => clearFilters()}>
                                        Reset
                                    </Button>
                                </Space>
                            </div>
                        )}
                        onFilter={(value, record) => record.content.includes(value.toLowerCase())}
                        filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />}

                    />
                    <Column title="Time" dataIndex="timestamp" key="timestamp"
                        render={(text, row, index) => {
                            return new Date(text).toLocaleString("en-US", { timeZone: "Asia/Singapore" });
                        }} />
                    <Column
                        title=""
                        key="action"
                        render={(text, record) => (
                            <Dropdown trigger={['click']} overlay={
                                <Menu>
                                    <Menu.Item onClick={() => {
                                        this.editAnnouncementOpen(record._id)
                                    }}>
                                        <span>
                                            Edit Announcement <ClusterOutlined />
                                        </span>
                                    </Menu.Item>
                                </Menu>
                            } placement="bottomCenter">
                                <Button>Actions</Button>
                            </Dropdown>
                        )}
                    />
                </Table>

            </Layout>
        );
    }
}

export default AdminManageAnnouncements;