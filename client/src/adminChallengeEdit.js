import React from 'react';
import { Tooltip, Layout, Divider, Modal, message, InputNumber, Button, Select, Space, Form, Input, Tabs, Tag, Switch } from 'antd';
import {
    MinusCircleOutlined,
    PlusOutlined,
    LeftOutlined,
    ProfileOutlined,
    FlagOutlined,
    EditTwoTone,
    SolutionOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';
import './App.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Ellipsis } from 'react-spinners-css';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JsxParser from 'react-jsx-parser';
import { Prompt } from 'react-router';


const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;


const CreateChallengeForm = (props) => {
    const [form] = Form.useForm();

    if (typeof form.getFieldValue("flags") === "undefined") {
        //console.log(props.initialData)
        if (props.initialData.visibility === false) {
            props.initialData.visibility = "false"
        }
        else if (props.initialData.visibility === true) {
            props.initialData.visibility = "true"
        }
        props.initialData.category1 = props.initialData.category
        form.setFieldsValue(props.initialData)
    }
    //Render existing categories select options
    let existingCats = []
    for (let i = 0; i < props.allCat.length; i++) {
        existingCats.push(<Option key={props.allCat[i].key} value={props.allCat[i].key}>{props.allCat[i].key}</Option>)
    }

    return (
        <Form
            form={form}
            name="create_challenge_form"
            className="create_challenge_form"
            onValuesChange={() => { if (props.state.edited === false) props.setState({ edited: true }) }}
            onFinish={(values) => {
                props.setState({ edited: false })
                if (typeof values.flags === "undefined") {
                    message.warn("Please enter at least 1 flag")
                }
                else {
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
                    props.setState({ editLoading: true })
                    //console.log(values)
                    fetch(window.ipAddress + "/v1/challenge/edit", {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
                        body: JSON.stringify({
                            "chall": props.initialData.name,
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
                            "writeupComplete": values.writeupComplete
                        })
                    }).then((results) => {
                        return results.json(); //return data in JSON (since its JSON data)
                    }).then((data) => {
                        //console.log(data)
                        if (data.success === true) {
                            message.success({ content: "Edited challenge \"" + props.initialData.name + "\" successfully!" })
                            props.setState({ editLoading: false })
                            props.handleEditChallBack()
                            form.resetFields()
                        }
                        else {
                            message.error({ content: "Oops. Unknown error" })
                        }


                    }).catch((error) => {
                        console.log(error)
                        message.error({ content: "Oops. There was an issue connecting with the server" });
                    })

                }

            }}
        >
            <Prompt
                when={props.state.edited}
                message='The challenge details you modified have not been saved. Are you sure you want to leave?'
            />

            <h1>Challenge Name:</h1>
            <Form.Item
                name="name"
                rules={[{ required: true, message: 'Please enter a challenge name' }]}
            >

                <Input allowClear placeholder="Challenge name" />
            </Form.Item>

            <h1>Challenge Category:</h1>
            <h4>Select an Existing Category: </h4>
            <Form.Item
                name="category1"
                initialValue={""}
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

            <h1>Challenge Description (Supports <a href="https://reactjs.org/docs/introducing-jsx.html" target="_blank" rel="noreferrer">JSX</a>):</h1>
            <Form.Item
                name="description"
                rules={[{ required: true, message: 'Please enter a description' }]}
            >

                <TextArea rows={5} allowClear placeholder="Enter a challenge description. JSX is very similiar to HTML, only difference being that there MUST be closing tags for everything." />
            </Form.Item>

            <div style={{ display: "flex", flexDirection: "row", justifyItems: "space-evenly", marginLeft: "2vw" }}>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center", width: "35vw" }}>
                    <h1>Challenge Points:</h1>
                    <Form.Item
                        name="points"
                        rules={[{ required: true, message: 'Please enter challenge points' }, {
                            type: 'integer',
                            message: "Please enter a valid integer between 1-100000",
                        },]}
                        initialValue={0}
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

                <Divider type="vertical" style={{ height: "inherit" }}></Divider>

                <div style={{ display: "flex", flexDirection: "column", width: "35vw", marginLeft: "2vw" }}>
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
                                        <Input placeholder="Hint" style={{ width: "50ch" }} />
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
                                        <InputNumber min={0} max={10000} style={{ width: "40ch" }} placeholder="Cost"></InputNumber>
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
            >
                <Select style={{ width: "10vw" }}>
                    <Option value="false"><span style={{ color: "#d32029" }}>Hidden <EyeInvisibleOutlined /></span></Option>
                    <Option value="true"><span style={{ color: "#49aa19" }}>Visible <EyeOutlined /></span></Option>
                </Select>

            </Form.Item>

            <Form.Item>
                <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "row" }}>
                    <div>
                        <Button style={{ marginBottom: "1.5vh", marginRight: "2vw", backgroundColor: "#d4b106", borderColor: "", color: "white" }} onClick={() => { props.previewChallenge(form.getFieldsValue()) }}>Preview</Button>
                        <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginBottom: "1.5vh" }} loading={props.editLoading}>Edit Challenge</Button>
                    </div>
                    <div>
                        <Button style={{ marginRight: "2vw" }} type="primary" danger onClick={() => { form.resetFields() }}>Clear</Button>
                    </div>
                </div>
            </Form.Item>

        </Form>
    );
};


class AdminChallengeEdit extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            editLoading: false,
            challengeData: {
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
            previewData: {
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
            previewModal: false,
            oldChallengeName: "",
            selectCatDisabled: false,
            inputCatDisabled: true,
            challengeWriteup: "",
            edited: false
        }
    }

    componentDidUpdate = () => {
        if (this.state.edited) {
            window.onbeforeunload = () => { }
        }
    }

    componentDidMount() {
        this.getChallengeDetails(this.props.challengeName)
        this.setState({ oldChallengeName: this.props.challengeName })
    }

    getChallengeDetails = (name) => {
        this.setState({ loading: true })
        fetch(window.ipAddress + "/v1/challenge/show/" + encodeURIComponent(name) + "/detailed", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            console.log(data)
            if (data.success === true) {
                this.setState({ challengeData: data.chall })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }

            this.setState({ loading: false })


        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    previewChallenge = (values) => {

        //Replace <code> with syntax highlighter
        if (typeof values.description !== "undefined") {
            let description = values.description
            let position = description.search("<code>")


            if (position !== -1) {

                let language = ""
                let offset = 0
                position += 6

                while (true) {
                    let currentLetter = description.slice(position + offset, position + offset + 1)
                    if (currentLetter === "\n") {
                        language = description.slice(position, position + offset)
                        description = description.slice(0, position) + description.slice(position + offset)
                        description = description.replace("<code>", "<SyntaxHighlighter language='" + language + "' style={atomDark}>{'")
                        description = description.replace("</code>", "'}</SyntaxHighlighter>")
                        values.description = description
                        break
                    }
                    else if (offset > 10) {
                        break
                    }
                    offset += 1
                }


            }
        }

        if (values.max_attempts === 0) {
            values.max_attempts = "Unlimited"
        }
        else {
            values.max_attempts = String(values.max_attempts) + "/" + String(values.max_attempts)
        }

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

        //Render writeup link
        let writeupLink = ""
        if (typeof values.writeup !== "undefined") {
            writeupLink = values.writeup
        }
        else writeupLink = ""

        this.setState({ previewData: values, previewModal: true, challengeTags: renderTags, challengeHints: renderHints, challengeWriteup: writeupLink })
    }

    render() {
        return (

            <Layout style={{ minHeight: "100vh", height: "100%", width: "100%", padding: "10px", backgroundColor: "rgba(0, 0, 0, 0.5)", border: "5px solid transparent", borderRadius: "20px" }}>
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
                            <h1 style={{ fontSize: "150%" }}>{this.state.previewData.name}</h1>
                            <div>
                                {this.state.challengeTags}
                            </div>
                            <h2 style={{ color: "#1765ad", marginTop: "2vh", marginBottom: "2vh", fontSize: "200%" }}>{this.state.previewData.points}</h2>
                            <JsxParser
                                bindings={{
                                    atomDark: atomDark
                                }}
                                components={{ SyntaxHighlighter }}
                                jsx={this.state.previewData.description}
                            />


                            <div style={{ marginTop: "6vh", display: "flex", flexDirection: "column" }}>
                                {this.state.challengeHints}
                            </div>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <Input style={{ width: "45ch" }} defaultValue="" placeholder={"Enter a flag"} />
                                <Button type="primary" icon={<FlagOutlined />}>Submit</Button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "2vh" }}>
                                <p>Challenge Author: {this.state.challengeData.author}</p>
                                <p style={{ color: "#d87a16", fontWeight: 500 }}>Attempts Remaining: {this.state.previewData.max_attempts}</p>
                            </div>
                        </TabPane>
                    </Tabs>


                </Modal>
                <div style={{ display: "flex", alignItems: "center", alignContent: "center" }}>
                    <Button type="primary" onClick={this.props.handleEditBack} icon={<LeftOutlined />} style={{ maxWidth: "20ch", marginBottom: "3vh", marginRight: "2vw" }}>Back</Button>
                    <h1 style={{ fontSize: "180%" }}> <EditTwoTone /> Edit Challenge</h1>

                </div>
                {!this.state.loading && (
                    <CreateChallengeForm allCat={this.props.allCat} state={this.state} editLoading={this.state.editLoading} setState={this.setState.bind(this)} previewChallenge={this.previewChallenge.bind(this)} initialData={this.state.challengeData} handleEditChallBack={this.props.handleEditChallBack}></CreateChallengeForm>
                )}

                {this.state.loading && (
                    <div>
                        <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                            <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                        </div>
                    </div>
                )}
            </Layout>
        );
    }
}

export default AdminChallengeEdit;