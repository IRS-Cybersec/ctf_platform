import React from 'react';
import { Layout, Divider, Modal, message, InputNumber, Button, Select, Space, Form, Input, Tabs, Tag, Tooltip, Switch, Card, Cascader } from 'antd';
import {
    MinusCircleOutlined,
    PlusOutlined,
    LeftOutlined,
    ProfileOutlined,
    FlagOutlined,
    FlagTwoTone,
    SolutionOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';
import './App.min.css';
import { Prompt } from 'react-router';
import MDEditor from '@uiw/react-md-editor';
import MarkdownRender from './MarkdownRenderer.js';


const { Option } = Select;
const { TabPane } = Tabs;


const CreateChallengeForm = (props) => {
    const [form] = Form.useForm();
    const [editorValue, setEditorValue] = React.useState("")

    if (typeof form.getFieldValue("flags") === "undefined") {
        var currentValues = form.getFieldsValue()
        currentValues.flags = [""]

        form.setFieldsValue(currentValues)
    }
    //Render existing categories select options
    let existingCats = []
    for (let i = 0; i < props.allCat.length; i++) {
        existingCats.push(<Option key={props.allCat[i].key} value={props.allCat[i].key}>{props.allCat[i].key}</Option>)
    }
    //Render existing challenges select options
    let existingChalls = {}
    for (let i = 0; i < props.challenges.length; i++) {
        if (!(props.challenges[i].category in existingChalls)) existingChalls[props.challenges[i].category] = []
        existingChalls[props.challenges[i].category].push({
            value: props.challenges[i].name,
            label: props.challenges[i].name
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

    return (
        <Form
            form={form}
            name="create_challenge_form"
            className="create_challenge_form"
            onValuesChange={() => { if (props.state.edited === false) props.setState({ edited: true }) }}
            onFinish={async (values) => {
                props.setState({ edited: false })
                if (typeof values.flags === "undefined") {
                    message.warn("Please enter at least 1 flag")
                }
                else {
                    //console.log(values)
                    props.setState({ loading: true })
                    if (values.visibility === "false") {
                        values.visibility = false
                    }
                    else {
                        values.visibility = true
                    }
                    if (typeof values.writeup !== "undefined") {
                        if (typeof values.writeupComplete === "undefined") {
                            values.writeupComplete = true
                        }
                    }
                    const category = (typeof values.category1 !== "undefined") ? values.category1 : values.category2
                    let requires = undefined
                    if (values.requires) requires = values.requires[1]
                    await fetch(window.ipAddress + "/v1/challenge/new", {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
                        body: JSON.stringify({
                            "name": values.name,
                            "category": category,
                            "description": values.description,
                            "points": values.points,
                            "flags": values.flags,
                            "tags": values.tags,
                            "hints": values.hints,
                            "max_attempts": values.max_attempts,
                            "visibility": values.visibility,
                            "writeup": values.writeup,
                            "writeupComplete": values.writeupComplete,
                            "requires": requires
                        })
                    }).then((results) => {
                        return results.json(); //return data in JSON (since its JSON data)
                    }).then((data) => {
                        //console.log(data)
                        if (data.success === true) {
                            message.success({ content: "Created challenge " + values.name + " successfully!" })
                            form.resetFields()
                            props.handleCreateBack()
                        }
                        else {
                            message.error({ content: "Oops. Unknown error, please contact an admin." })
                        }
                        


                    }).catch((error) => {
                        console.log(error)
                        message.error({ content: "Oops. Issue connecting with the server or client error, please check console and report the error. " });
                    })
                    props.setState({ loading: false })


                }

            }}

        >
            <Prompt
                when={props.state.edited}
                message='The challenge details you entered have not been saved. Are you sure you want to leave?'
            />

            <h1>Challenge Name:</h1>
            <Form.Item
                name="name"
                rules={[{ required: true, message: 'Please enter a challenge name' }]}
            >

                <Input allowClear placeholder="Challenge name" />
            </Form.Item>

            <Divider />
            <h1>Challenge Category:</h1>
            <h4>Select an Existing Category: </h4>
            <Form.Item
                name="category1"
                rules={[{ required: !props.state.selectCatDisabled, message: 'Please enter a challenge category' }]}
            >

                <Select
                    disabled={props.state.selectCatDisabled}
                    allowClear
                    showSearch
                    placeholder="Select an existing Category"
                    onChange={(value) => {
                        if (value) {
                            props.setState({ inputCatDisabled: true })
                        }
                        else {
                            props.setState({ inputCatDisabled: false })
                        }
                    }}
                >
                    {existingCats}
                </Select>

            </Form.Item>
            <h4>Enter a New Category</h4>
            <Form.Item
                name="category2"
                rules={[{ required: !props.state.inputCatDisabled, message: 'Please enter a challenge category' }]}
            >

                <Input onChange={(e) => {
                    e.target.value.length > 0 ? props.setState({ selectCatDisabled: true }) : props.setState({ selectCatDisabled: false })
                }} disabled={props.state.inputCatDisabled} allowClear placeholder="Enter a new challenge category" />
            </Form.Item>

            <Divider />

            <h1>Challenge Description (Supports <a href="https://guides.github.com/features/mastering-markdown/" target="_blank" rel="noreferrer">Markdown</a> and <a href="https://katex.org/" target="_blank" rel="noreferrer">Math Using KaTeX</a>):</h1>
            <Form.Item
                name="description"
                rules={[{ required: true, message: 'Please enter a description' }]}
                valuePropName={editorValue}
            >
                <MDEditor value={editorValue} onChange={(value) => { setEditorValue(value) }} preview="edit" />
            </Form.Item>
            <h3>Challenge Description Preview</h3>
            <Card
                type="inner"
                bordered={true}
                bodyStyle={{ backgroundColor: "#262626", textAlign: "center" }}
                className="challengeModal"
            >
                <MarkdownRender>{editorValue}</MarkdownRender>
            </Card>


            <Divider />

            <div style={{ display: "flex", flexDirection: "row", justifyItems: "space-evenly", marginLeft: "3%" }}>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "40%" }}>
                    <h1>Challenge Points:</h1>
                    <Form.Item
                        name="points"
                        rules={[{ required: true, message: 'Please enter challenge points' }, {
                            type: 'integer',
                            message: "Please enter a valid integer between 1-100000",
                        },]}
                        initialValue={1}
                    >

                        <InputNumber min={1} max={100000} style={{ width: "30ch" }} ></InputNumber>
                    </Form.Item>

                    <h1>Maximum Number of Attempts (Set to 0 for unlimited)</h1>
                    <Form.Item
                        name="max_attempts"
                        rules={[{ required: true, message: 'Please enter the maximum number of attempts' }, {
                            type: 'integer',
                            message: "Please enter a valid integer between 0-10000",
                        },]}
                        style={{ alignText: 'center' }}
                        initialValue={0}
                    >

                        <InputNumber min={0} max={10000} style={{ width: "30ch" }}></InputNumber>
                    </Form.Item>
                </div>

                <Divider type="vertical" style={{ height: "inherit" }} />

                <div style={{ display: "flex", flexDirection: "column", width: "40%", marginLeft: "3%" }}>
                    <Form.List name="flags" >
                        {(fields, { add, remove }) => {
                            return (
                                <div>
                                    <h1>Flags</h1>
                                    {fields.map(field => (
                                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                            <Form.Item
                                                {...field}
                                                name={[field.name]}
                                                fieldKey={[field.fieldKey]}
                                                rules={[{ required: true, message: 'Missing flag' }]}
                                            >
                                                <Input style={{ width: "50ch" }} placeholder="Flag" />
                                            </Form.Item>

                                            {fields.length > 1 ? (
                                                <MinusCircleOutlined
                                                    className="dynamic-delete-button"
                                                    style={{ margin: '0 8px', color: "red" }}
                                                    onClick={() => {
                                                        remove(field.name);
                                                    }}
                                                />
                                            ) : null}
                                        </Space>
                                    ))}

                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onLoad={() => { if (fields.length < 1) add() }}
                                            onClick={() => {
                                                add();
                                            }}
                                            block
                                            style={{ width: "50ch" }}
                                        >
                                            <PlusOutlined /> Add Flag
                                        </Button>
                                    </Form.Item>


                                </div>
                            );
                        }}
                    </Form.List>

                    <Form.List name="tags">
                        {(fields, { add, remove }) => {
                            return (
                                <div>
                                    <h1>Tags</h1>
                                    {fields.map(field => (
                                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="start">

                                            <Form.Item
                                                {...field}
                                                name={[field.name]}
                                                fieldKey={[field.fieldKey]}
                                                rules={[{ required: true, message: 'Missing tag' }]}
                                            >
                                                <Input placeholder="Tag" style={{ width: "50ch" }} />
                                            </Form.Item>


                                            <MinusCircleOutlined
                                                className="dynamic-delete-button"
                                                style={{ margin: '0 8px', color: "red" }}
                                                onClick={() => {
                                                    remove(field.name);
                                                }}
                                            />
                                        </Space>
                                    ))}

                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => {
                                                add();
                                            }}
                                            block
                                            style={{ width: "50ch" }}
                                        >
                                            <PlusOutlined /> Add Tag
                                        </Button>
                                    </Form.Item>
                                </div>
                            );
                        }}
                    </Form.List>
                </div>
            </div>

            <Divider />


            <div style={{ display: "flex", flexDirection: "row", justifyItems: "space-evenly", marginLeft: "3%" }}>

                <div style={{ width: "40%", display: "flex", flexDirection: "column" }}>
                    <h1>Hints</h1>
                    <Form.List name="hints" >
                        {(fields, { add, remove }) => {
                            return (
                                <div>
                                    {fields.map(field => (
                                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "hint"]}
                                                fieldKey={[field.fieldKey, "hint"]}
                                                rules={[{ required: true, message: 'Missing hint' }]}
                                            >
                                                <Input placeholder="Hint" style={{ width: "20vw" }} />
                                            </Form.Item>

                                            <Form.Item
                                                {...field}
                                                name={[field.name, "cost"]}
                                                fieldKey={[field.fieldKey, "cost"]}
                                                rules={[{ required: true, message: 'Missing cost for hint' }, {
                                                    type: 'integer',
                                                    message: "Please enter a valid integer between 0-10000",
                                                },]}
                                            >
                                                <InputNumber min={0} max={10000} placeholder="Cost"></InputNumber>
                                            </Form.Item>

                                            <MinusCircleOutlined
                                                style={{ color: "red" }}
                                                onClick={() => {
                                                    remove(field.name);
                                                }}
                                            />
                                        </Space>
                                    ))}

                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => {
                                                add();
                                            }}
                                            block
                                            style={{ width: "50ch" }}
                                        >
                                            <PlusOutlined /> Add Hint
                                        </Button>
                                    </Form.Item>
                                </div>
                            );
                        }}
                    </Form.List>

                    <h1>Writeup Link (Optional)</h1>
                    <Form.Item
                        name="writeup"
                        rules={[
                            {
                                type: 'url',
                                message: "Please enter a valid link",
                            }]}
                    >

                        <Input allowClear style={{ width: "50ch" }} placeholder="Enter a writeup link for this challenge" />
                    </Form.Item>
                    <div style={{ display: "flex", alignContent: "center" }}>
                        <h4 style={{ marginRight: "2ch" }}>Release Writeup Only After Completion: </h4>
                        <Form.Item
                            name="writeupComplete"
                        >
                            <Switch defaultChecked />
                        </Form.Item>
                    </div>

                    <h1>Visibility</h1>
                    <Form.Item
                        name="visibility"
                        rules={[{ required: true, message: 'Please set the challenge visibility' }]}
                        initialValue="false"
                    >
                        <Select style={{ width: "10vw" }}>
                            <Option value="false"><span style={{ color: "#d32029" }}>Hidden <EyeInvisibleOutlined /></span></Option>
                            <Option value="true"><span style={{ color: "#49aa19" }}>Visible <EyeOutlined /></span></Option>
                        </Select>

                    </Form.Item>

                </div>

                <Divider type="vertical" style={{ height: "inherit" }} />

                <div style={{ width: "40%", display: "flex", flexDirection: "column", marginLeft: "3%" }}>
                    <h1>Challenge Required: </h1>
                    <Form.Item
                        name="requires"
                    >

                        <Cascader
                            options={finalSortedChalls}
                            allowClear
                            showSearch
                            placeholder="Select an existing challenge" />

                    </Form.Item>
                    <p>Locks this challenge until the provided challenge above has been solved.</p>
                </div>
            </div>

            <Form.Item>
                <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "row", marginTop: "2vh" }}>
                    <div>
                        <Button style={{ marginBottom: "1.5vh", marginRight: "2vw", backgroundColor: "#d4b106", borderColor: "", color: "white" }} onClick={() => { props.previewChallenge(form.getFieldsValue()); }}>Preview</Button>
                        <Button loading={props.loadingStatus} type="primary" htmlType="submit" className="login-form-button" style={{ marginBottom: "1.5vh" }}>Create Challenge</Button>
                    </div>
                    <div>
                        <Button style={{ marginRight: "2vw" }} type="primary" danger onClick={() => { form.resetFields() }}>Clear</Button>
                    </div>
                </div>
            </Form.Item>

        </Form>
    );
};


class AdminChallengeCreate extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            previewChallenge: {
                name: "",
                category: this.props.category,
                description: "",
                points: 0,
                author: "",
                created: "",
                solves: [],
                max_attempts: 0,
                tags: [],
                hints: [],
            },
            challengeTags: [],
            challengeHints: [],
            previewModal: false,
            inputCatDisabled: false,
            selectCatDisabled: false,
            challengeWriteup: "",
            edited: false
        }
    }

    componentDidUpdate = () => {
        if (this.state.edited) {
            window.onbeforeunload = () => { }
        }
    }

    previewChallenge = (values) => {

        if (values.max_attempts === 0) {
            values.max_attempts = "Unlimited"
        }
        else {
            values.max_attempts = String(values.max_attempts) + "/" + String(values.max_attempts)
        }

        //Render writeup link
        let writeupLink = ""
        if (typeof values.writeup !== "undefined") {
            writeupLink = values.writeup
        }
        else writeupLink = ""

        var renderTags = []
        if (typeof values.tags !== "undefined") {
            const tag = values.tags

            for (let x = 0; x < tag.length; x++) {
                renderTags.push(
                    <Tag color="#1765ad">
                        {tag[x]}
                    </Tag>
                )
            }

        }

        //Handle hints
        if (typeof values.hints !== "undefined") {
            const hints = values.hints
            var renderHints = []

            for (let x = 0; x < hints.length; x++) {
                renderHints.push(
                    <Button type="primary" key={hints[x].cost} style={{ marginBottom: "1.5vh" }}>Hint {x + 1} - {hints[x].cost} Points</Button>
                )
            }

        }

        this.setState({ previewChallenge: values, previewModal: true, challengeTags: renderTags, challengeHints: renderHints, challengeWriteup: writeupLink })
    }

    render() {
        return (

            <Layout className="form-style">

                <Modal
                    title={null}
                    visible={this.state.previewModal}
                    footer={null}
                    bodyStyle={{ textAlign: "center" }}
                    onCancel={() => { this.setState({ previewModal: false }) }}
                >
                    <Tabs defaultActiveKey="challenge">
                        <TabPane
                            tab={<span><ProfileOutlined /> Challenge</span>}
                            key="challenge"
                        >
                            {this.state.challengeWriteup !== "" && (
                                <Tooltip title="View writeups for this challenge">
                                    <Button shape="circle" size="large" style={{ position: "absolute", right: "2ch" }} type="primary" icon={<SolutionOutlined />} onClick={() => { window.open(this.state.challengeWriteup) }} />
                                </Tooltip>
                            )}
                            {this.state.challengeWriteup === "" && (
                                <Tooltip title="Writeups are not available for this challenge">
                                    <Button disabled shape="circle" size="large" style={{ position: "absolute", right: "2ch" }} type="primary" icon={<SolutionOutlined />} />
                                </Tooltip>
                            )}
                            <h1 style={{ fontSize: "150%" }}>{this.state.previewChallenge.name}</h1>
                            <div>
                                {this.state.challengeTags}
                            </div>
                            <h2 style={{ color: "#1765ad", marginTop: "2vh", marginBottom: "6vh", fontSize: "200%" }}>{this.state.previewChallenge.points}</h2>

                            <div className="challengeModal">
                                <MarkdownRender>{this.state.previewChallenge.description}</MarkdownRender>
                            </div>

                            <div style={{ marginTop: "6vh", display: "flex", flexDirection: "column" }}>
                                {this.state.challengeHints}
                            </div>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <Input style={{ width: "45ch" }} defaultValue="" placeholder={"Enter a flag"} />
                                <Button type="primary" icon={<FlagOutlined />}>Submit</Button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "2vh" }}>
                                <p>Challenge Author: <em>You</em></p>
                                <p style={{ color: "#d87a16", fontWeight: 500 }}>Attempts Remaining: {this.state.previewChallenge.max_attempts}</p>
                            </div>
                        </TabPane>
                    </Tabs>


                </Modal>
                <div style={{ display: "flex", alignItems: "center", alignContent: "center" }}>
                    <Button type="primary" onClick={this.props.handleBack} icon={<LeftOutlined />} style={{ maxWidth: "20ch", marginBottom: "3vh", marginRight: "2vw" }}>Back</Button>
                    <h1 style={{ fontSize: "180%" }}> <FlagTwoTone /> Create New Challenge</h1>

                </div>
                <CreateChallengeForm allCat={this.props.allCat} challenges={this.props.challenges} handleCreateBack={this.props.handleCreateBack.bind(this)} previewChallenge={this.previewChallenge.bind(this)} state={this.state} loadingStatus={this.state.loading} setState={this.setState.bind(this)}></CreateChallengeForm>
            </Layout>
        );
    }
}

export default AdminChallengeCreate;