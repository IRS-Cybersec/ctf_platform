import React, { useState } from 'react';
import { Layout, Table, message, Button, Space, Input, Modal, Form, Cascader, Select, InputNumber } from 'antd';
import {
    FileUnknownTwoTone,
    RedoOutlined,
    SearchOutlined,
    FileOutlined,
    UserOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    EditOutlined
} from '@ant-design/icons';
import orderBy from 'lodash.orderby'
import { Ellipsis } from 'react-spinners-css';
import { Link } from 'react-router-dom';

const { Column } = Table;
const { confirm } = Modal;

const CreateT = (props) => {
    const [isHint, setIsHint] = useState(false)
    const [isNonZero, setNonZero] = useState(false)
    const [correctValue, setCorrectValue] = useState(true)
    const [form] = Form.useForm();

    return (
        <Form
            form={form}
            name="register_form"
            className="register-form"
            onFinish={async (values) => {
                // must use correctValue state value instead
                await fetch(window.ipAddress + "/v1/submissions/new", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "author": values.author,
                        "challenge": values.challenge[1][0],
                        "challengeID": values.challenge[1][1],
                        "type": values.type,
                        "points": values.points,
                        "correct": correctValue,
                        "submission": values.submission,
                        "hint_id": values.hint_id
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Created transaction successfully!" })
                        setNonZero(false)
                        setCorrectValue(false)
                        setIsHint(false)
                        props.setState({ createTModal: false })
                        props.refresh()
                        form.resetFields()
                    }
                    else if (data.error === "not-found") {
                        message.error("Oops. User not found.")
                    }
                    else {
                        message.error({ content: "Oops. Unknown error" })
                    }


                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
            }}
        >
            <h4>Select an Account</h4>
            <Form.Item
                name="author"
                rules={[{ required: true, message: 'Please enter an author' }]}
            >
                <Input allowClear prefix={<UserOutlined />} placeholder="Account which this transaction will belong to" />
            </Form.Item>

            <h4>Select a Challenge</h4>
            <Form.Item
                name="challenge"
                rules={[{ required: true, message: 'Please select a challenge' }]}
            >
                <Cascader
                    options={props.challengeList}
                    allowClear
                    showSearch
                    placeholder="Select an existing challenge which this transaction will belong to" />
            </Form.Item>

            <h4>Select a Type</h4>
            <Form.Item
                name="type"
                rules={[{ required: true, message: 'Please select the type of transaction' }]}
                initialValue="submission"
            >
                <Select onSelect={(type) => { type === "hint" ? setIsHint(true) : setIsHint(false) }}>
                    <Option value="submission">Submission</Option>
                    <Option value="hint">Hint</Option>
                    <Option value="blocked_submission">Blocked Submission</Option>
                </Select>

            </Form.Item>

            <h4>Input Amount of Points</h4>
            <Form.Item
                name="points"
                rules={[{ required: true, message: 'Please input the amount of points' }]}
                initialValue={0}
            >
                <InputNumber onChange={(value) => {
                    if (value !== 0) {
                        setNonZero(true)
                        setCorrectValue(true)
                    }
                    else setNonZero(false)
                }} min={-100000} max={100000} ></InputNumber>

            </Form.Item>

            {!isHint ?
                <div>


                    <h4>Choose whether this is a "Correct" submission</h4>
                    <Form.Item
                        name="correct"
                        rules={[{ required: true, message: 'Please select whether it is correct' }]}
                        initialValue={true}
                        valuePropName={correctValue}
                    >
                        <Select value={correctValue} onSelect={(value) => setCorrectValue(value)} disabled={isNonZero}>
                            <Option value={true}>Correct</Option>
                            <Option value={false}>Wrong</Option>
                        </Select>

                    </Form.Item>

                    <h4>Enter a Submission</h4>
                    <Form.Item
                        name="submission"
                        rules={[{ required: true, message: 'Please enter a submission' }]}
                    >
                        <Input allowClear placeholder="The user's flag input" />
                    </Form.Item>
                </div>
                :
                <div>
                    <h4>Enter a hint ID (hint number of the challenge from <code>1-n</code>)</h4>
                    <Form.Item
                        name="hint_id"
                        rules={[{ required: true, message: 'Please enter a hint ID' }]}
                        initialValue={1}
                    >
                        <InputNumber min={-100000} max={100000}></InputNumber>

                    </Form.Item>
                </div>}


            <Form.Item>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Button style={{ marginRight: "1.5vw" }} onClick={() => { props.setState({ createTModal: false }) }}>Cancel</Button>
                    <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginBottom: "1.5vh" }}>Create Transaction</Button>
                </div>
            </Form.Item>
        </Form>
    );
};

const EditT = (props) => {
    const [isHint, setIsHint] = useState(false)
    const [isNonZero, setNonZero] = useState(false)
    const [correctValue, setCorrectValue] = useState(true)
    const [form] = Form.useForm();



    if (typeof form.getFieldValue("author") === "undefined") {
        let initialData = JSON.parse(JSON.stringify(props.initialData))
        initialData.challenge = ["", [props.initialData.challenge, props.initialData.challengeID]]
        if (initialData.type === "hint") setIsHint(true)
        if (initialData.points !== 0) setNonZero(true)
        form.setFieldsValue(initialData)
    }


    return (
        <Form
            form={form}
            onFinish={async (values) => {
                // must use correctValue state value instead
                await fetch(window.ipAddress + "/v1/submissions/edit", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                    body: JSON.stringify({
                        "id": props.initialData._id,
                        "author": values.author,
                        "challenge": values.challenge[1][0],
                        "challengeID": values.challenge[1][1],
                        "type": values.type,
                        "points": values.points,
                        "correct": correctValue,
                        "submission": values.submission,
                        "hint_id": values.hint_id
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Edited transaction successfully!" })
                        setNonZero(false)
                        setCorrectValue(false)
                        setIsHint(false)
                        props.setState({ editTModal: false })
                        props.refresh()
                        form.resetFields()
                    }
                    else {
                        message.error({ content: "Oops. Unknown error" })
                    }


                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
            }}
        >
            <p><b><u>ID:</u></b> <code>{props.initialData._id}</code></p>

            <h4>Select an Account</h4>
            <Form.Item
                name="author"
                rules={[{ required: true, message: 'Please enter an author' }]}
            >
                <Input allowClear prefix={<UserOutlined />} placeholder="Account which this transaction will belong to" />
            </Form.Item>

            <h4>Select a Challenge</h4>
            <Form.Item
                name="challenge"
                rules={[{ required: true, message: 'Please select a challenge' }]}
            >
                <Cascader
                    options={props.challengeList}
                    allowClear
                    showSearch
                    placeholder="Select an existing challenge which this transaction will belong to" />
            </Form.Item>

            <h4>Select a Type</h4>
            <Form.Item
                name="type"
                rules={[{ required: true, message: 'Please select the type of transaction' }]}
                initialValue="submission"
            >
                <Select onSelect={(type) => { type === "hint" ? setIsHint(true) : setIsHint(false) }}>
                    <Option value="submission">Submission</Option>
                    <Option value="hint">Hint</Option>
                    <Option value="blocked_submission">Blocked Submission</Option>
                </Select>

            </Form.Item>

            <h4>Input Amount of Points</h4>
            <Form.Item
                name="points"
                rules={[{ required: true, message: 'Please input the amount of points' }]}
                initialValue={0}
            >
                <InputNumber onChange={(value) => {
                    if (value !== 0) {
                        setNonZero(true)
                        setCorrectValue(true)
                    }
                    else setNonZero(false)
                }} min={-100000} max={100000} ></InputNumber>

            </Form.Item>

            {!isHint ?
                <div>


                    <h4>Choose whether this is a "Correct" submission</h4>
                    <Form.Item
                        name="correct"
                        rules={[{ required: true, message: 'Please select whether it is correct' }]}
                        initialValue={true}
                        valuePropName={correctValue}
                    >
                        <Select value={correctValue} onSelect={(value) => setCorrectValue(value)} disabled={isNonZero}>
                            <Option value={true}>Correct</Option>
                            <Option value={false}>Wrong</Option>
                        </Select>

                    </Form.Item>

                    <h4>Enter a Submission</h4>
                    <Form.Item
                        name="submission"
                        rules={[{ required: true, message: 'Please enter a submission' }]}
                    >
                        <Input allowClear placeholder="The user's flag input" />
                    </Form.Item>
                </div>
                :
                <div>
                    <h4>Enter a hint ID (hint number of the challenge from <code>1-n</code>)</h4>
                    <Form.Item
                        name="hint_id"
                        rules={[{ required: true, message: 'Please enter a hint ID' }]}
                        initialValue={1}
                    >
                        <InputNumber min={-100000} max={100000}></InputNumber>

                    </Form.Item>
                </div>}


            <Form.Item>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Button style={{ marginRight: "1.5vw" }} onClick={() => { props.setState({ editTModal: false }) }}>Cancel</Button>
                    <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginBottom: "1.5vh" }}>Edit Transaction</Button>
                </div>
            </Form.Item>
        </Form>
    );
};

class AdminSubmissions extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            dataSource: [],
            createTModal: false,
            challengeList: [],
            selectedTableKeys: [],
            disableEditButtons: true,
            editTModal: false,
            initialData: {},
            categoryList: []
        }
    }

    componentDidMount() {
        this.refresh()
    }

    refresh = async () => {
        this.setState({ loading: true })
        await Promise.all([this.fillTableData(), this.getChallengesList()])
        this.setState({ loading: false })
    }
    fillTableData = async () => {
        await fetch(window.ipAddress + "/v1/submissions", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            data.submissions = orderBy(data.submissions, ["timestamp"], ["desc"])

            if (data.success === true) {
                for (let i = 0; i < data.submissions.length; i++) {

                    if ("correct" in data.submissions[i]) {
                        if (data.submissions[i].correct === true) data.submissions[i].correct = "✅"
                        else data.submissions[i].correct = "❌"
                        data.submissions[i].hint_id = "N/A"
                    }
                    else {
                        data.submissions[i].correct = "N/A"
                        data.submissions[i].submission = "N/A"
                    }
                    if ("originalAuthor" in data.submissions[i]) {
                        const temp = JSON.parse(JSON.stringify(data.submissions[i]))
                        data.submissions[i].author = temp.originalAuthor
                        data.submissions[i].team = temp.author
                    }
                    else data.submissions[i].team = "N/A"
                    data.submissions[i].key = data.submissions[i]._id
                    data.submissions[i].timestamp = new Date(data.submissions[i].timestamp).toLocaleString("en-US", { timeZone: "Asia/Singapore" })

                    if (data.submissions[i].author in data.userCatMapping && data.userCatMapping[data.submissions[i].author] !== "none") data.submissions[i].category = data.userCatMapping[data.submissions[i].author]
                    else data.submissions[i].category = "N/A"
                }

                this.setState({ categoryList: data.categoryList, dataSource: data.submissions })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        return true
    }

    getChallengesList = async () => {
        await fetch(window.ipAddress + "/v1/challenge/list_all", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            data.submissions = orderBy(data.submissions, ["timestamp"], ["desc"])

            if (data.success === true) {
                let existingChalls = {}
                for (let i = 0; i < data.challenges.length; i++) {
                    if (!(data.challenges[i].category in existingChalls)) existingChalls[data.challenges[i].category] = []
                    existingChalls[data.challenges[i].category].push({
                        value: [data.challenges[i].name, data.challenges[i]._id],
                        label: data.challenges[i].name
                    })
                }
                let finalSortedChalls = []
                for (const category in existingChalls) {
                    finalSortedChalls.push({
                        value: category,
                        label: category,
                        children: existingChalls[category]
                    })
                }
                this.setState({ challengeList: finalSortedChalls })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
        return true
    }

    handleTableSelect = (selectedRowKeys) => {
        this.setState({ selectedTableKeys: selectedRowKeys })
        if (this.state.disableEditButtons && selectedRowKeys.length > 0) this.setState({ disableEditButtons: false })
        else if (!this.state.disableEditButtons && selectedRowKeys.length === 0) this.setState({ disableEditButtons: true })

    }

    deleteTransactions = async (close, ids) => {
        this.setState({ disableEditButtons: true })
        await fetch(window.ipAddress + "/v1/submissions/delete", {
            method: 'post',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
            body: JSON.stringify({
                "ids": ids,
            })
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                message.success({ content: "Deleted transactions [" + ids.join(", ") + "] successfully!" })
                this.refresh()
                this.setState({ selectedTableKeys: [] })
            }
            else if (data.error === "not-found") {
                message.warn("Only managed to delete some transactions")
                message.warn({ content: "The transactions [" + data.ids.join(", ") + "] were not found and couldn't be deleted" })
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






    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", backgroundColor: "rgba(0, 0, 0, 0)" }}>

                <Modal
                    title="Create New Transaction"
                    visible={this.state.createTModal}
                    footer={null}
                    onCancel={() => { this.setState({ createTModal: false }) }}
                >

                    <CreateT refresh={this.refresh.bind(this)} challengeList={this.state.challengeList} setState={this.setState.bind(this)}></CreateT>
                </Modal>

                <Modal
                    title="Edit Transaction"
                    visible={this.state.editTModal}
                    footer={null}
                    destroyOnClose
                    onCancel={() => { this.setState({ editTModal: false }) }}
                >

                    <EditT initialData={this.state.initialData} refresh={this.refresh.bind(this)} challengeList={this.state.challengeList} setState={this.setState.bind(this)}></EditT>
                </Modal>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", height: "2ch" }}>
                        <Button type="primary" style={{ marginBottom: "2vh", marginRight: "1ch" }} icon={<FileOutlined />} onClick={() => { this.setState({ createTModal: true }) }}>Create New Transaction</Button>
                        {this.state.loading && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <Ellipsis color="#177ddc" size={60} ></Ellipsis>
                                <h1>Loading Transactions</h1>
                            </div>
                        )}
                    </div>
                    <Button loading={this.state.loading} type="primary" shape="circle" size="large" style={{ marginBottom: "2vh", maxWidth: "25ch" }} icon={<RedoOutlined />} onClick={async () => { await this.fillTableData(); message.success("Submissions list refreshed.") }} />
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <Button disabled={this.state.disableEditButtons} style={{ marginBottom: "2vh", marginRight: "1ch", backgroundColor: "#a61d24" }} icon={<DeleteOutlined />} onClick={() => {
                        confirm({
                            confirmLoading: this.state.disableEditButtons,
                            title: 'Are you sure you want to delete the transactions(s) [' + this.state.selectedTableKeys.join(", ") + ']? This action is irreversible.',
                            icon: <ExclamationCircleOutlined />,
                            onOk: (close) => { this.deleteTransactions(close.bind(this), this.state.selectedTableKeys) },
                            onCancel: () => { },
                        });
                    }}>Delete Transactions</Button>
                </div>
                <Table rowSelection={{ selectedRowKeys: this.state.selectedTableKeys, onChange: this.handleTableSelect.bind(this) }} style={{ overflow: "auto" }} dataSource={this.state.dataSource} locale={{
                    emptyText: (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                            <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                            <h1 style={{ fontSize: "200%" }}>No Submissions Found/Created.</h1>
                        </div>
                    )
                }}>
                    <Column title="Time" dataIndex="timestamp" key="timestamp" />
                    <Column title="Submittor" dataIndex="author" key="author" render={(text, row, index) => {
                        return <Link to={"/Profile/" + text}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                    }}
                        filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                            <div style={{ padding: 8 }}>
                                <Input
                                    placeholder="Search Submittor"
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
                        onFilter={(value, record) => record.author.toLowerCase().trim().includes(value.toLowerCase())}
                        filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />}

                    />
                    <Column title="Team" dataIndex="team" key="team" render={(text, row, index) => {
                        return <Link to={"/Team/" + text}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                    }}
                        filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                            <div style={{ padding: 8 }}>
                                <Input
                                    placeholder="Search Team"
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
                        onFilter={(value, record) => record.team.toLowerCase().trim().includes(value.toLowerCase())}
                        filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />}

                    />
                    <Column title="Category" dataIndex="category" key="category" filters={
                        this.state.categoryList.map((category) => {
                            return { text: category, value: category }
                        })} onFilter={(value, record) => { return value === record.category }} />
                    <Column render={(text, row, index) => {
                        return <Link to={"/Challenges/" + row.challengeID}><a style={{ fontWeight: 700 }}>{text}</a></Link>;
                    }} title="Challenge" dataIndex="challenge" key="challenge"
                        filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                            <div style={{ padding: 8 }}>
                                <Input
                                    placeholder="Search Challenge Name"
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
                        onFilter={(value, record) => record.challenge.toLowerCase().trim().includes(value.toLowerCase())}
                        filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />} />
                    <Column title="Hint ID" dataIndex="hint_id" key="hint_id" filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                        <div style={{ padding: 8 }}>
                            <Input
                                placeholder="Search Hint ID"
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
                        onFilter={(value, record) => record.hint_id == parseInt(value)}
                        filterIcon={filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />} />
                    <Column title="Type" dataIndex="type" key="type" filters={[{ text: "Submission", value: "submission" }, { text: "Hint", value: "hint" }, { text: "Blocked Submission", value: "blocked_submission" }, { text: "Initial Register", value: "initial_register" }]} onFilter={(value, record) => { return value === record.type }} />
                    <Column title="Points Awarded" dataIndex="points" key="points" sorter={(a, b) => a.points - b.points} />

                    <Column title="Flag Submitted" dataIndex="submission" key="submission" />
                    <Column title="Correct" dataIndex="correct" key="correct" filters={[{ text: "✅", value: "✅" }, { text: "❌", value: "❌" }]} onFilter={(value, record) => { return value === record.correct }} />
                    <Column
                        title=""
                        key="edit"
                        render={(text, record) => (
                            <Button icon={<EditOutlined />} onClick={() => { this.setState({ editTModal: true, initialData: record }) }}> Edit</Button>
                        )}
                    />
                </Table>
            </Layout >
        );
    }
}

export default AdminSubmissions;