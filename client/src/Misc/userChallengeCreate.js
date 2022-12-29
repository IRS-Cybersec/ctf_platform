import React, { Suspense, useEffect, useState } from 'react';
import { Layout, Divider, Modal, message, InputNumber, Button, Select, Space, Form, Input, Tabs, Tag, Switch, Card } from 'antd';
import {
    MinusCircleOutlined,
    PlusOutlined,
    ProfileOutlined,
    FlagOutlined,
    FlagTwoTone,
    EyeOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';
import { Ellipsis } from 'react-spinners-css';
const MDEditor = React.lazy(() => import("@uiw/react-md-editor"));
const MarkdownRender = React.lazy(() => import('./MarkdownRenderer.js'));


const { Option } = Select;
const { TabPane } = Tabs;

const CreateChallengeForm = (props) => {
    const [form] = Form.useForm();
    const [editorValue, setEditorValue] = useState("")
    const [existingCats, setExistingCats] = useState([])

    const handleStartup = async () => {
        var currentValues = form.getFieldsValue()
        currentValues.flags = [""]

        await fetch(window.ipAddress + "/v1/challenge/listCategoryInfo", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            if (data.success === true) {
                let allCat = []
                for (const cat in data.categories) {
                    allCat.push(<Option key={cat} value={cat}>{cat}</Option>)
                }
                setExistingCats(allCat)
            } 
            else message.error({ content: "Oops. Unknown error" })
        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })

       
    }
    useEffect(() => { 
        handleStartup()
    }, [])



    return (
        <Form
            form={form}
            name="create_challenge_form"
            className="create_challenge_form"
            onFinish={async (values) => {
                props.setState({ edited: false })
                //console.log(values)
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
                    const category = (typeof values.category1 !== "undefined") ? values.category1 : values.category2
                    if (typeof values.writeup !== "undefined") {
                        if (typeof values.writeupComplete === "undefined") {
                            values.writeupComplete = true
                        }
                    }
                    await fetch(window.ipAddress + "/v1/challenge/new", {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
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
                            "writeupComplete": values.writeupComplete
                        })
                    }).then((results) => {
                        return results.json(); //return data in JSON (since its JSON data)
                    }).then((data) => {
                        //console.log(data)
                        if (data.success === true) {
                            message.success({ content: "Created challenge " + values.name + " successfully!" })
                            form.resetFields()
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

            <Suspense fallback={<div style={{ height: "100%", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 15 }}>
                <Ellipsis color="#177ddc" size={120} ></Ellipsis>
            </div>}>
                <h1>Challenge Description (Supports <a href="https://guides.github.com/features/mastering-markdown/" target="_blank" rel="noreferrer">Markdown</a> and <a href="https://github.com/rehypejs/rehype-raw" target="_blank" rel="noreferrer">HTML</a>)):</h1>
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
            </Suspense>


            <Divider />

            <div style={{ display: "flex", flexDirection: "row", justifyItems: "space-evenly", marginLeft: "2vw" }}>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "35vw" }}>
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

            <Divider />

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

            <Form.Item>
                <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "row" }}>
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

class UserChallengeCreate extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mainLoading: true,
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
            selectCatDisabled: false,
            selectInputDisabled: false,
            edited: false
        }
    }

    componentDidUpdate = () => {
        if (this.state.edited) {
            window.onbeforeunload = () => { }
        }
    }

    componentDidMount = () => {
        fetch(window.ipAddress + "/v1/challenge/list_categories", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then(async (data) => {

            if (data.success === true) {
                await this.setState({ allCat: data.categories })
                await this.setState({ mainLoading: false })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }

        }).catch((error) => {
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    previewChallenge = (values) => {

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

        this.setState({ previewChallenge: values, previewModal: true, challengeTags: renderTags, challengeHints: renderHints })
    }

    render() {
        return (

            <Layout style={{ margin: "20px", backgroundColor: "rgba(0, 0, 0, 0)" }}>
                <div style={{ padding: "10px", backgroundColor: "rgba(0, 0, 0, 0.5)", border: "5px solid transparent", borderRadius: "20px" }}>
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
                        <h1 style={{ fontSize: "180%" }}> <FlagTwoTone /> Create New Challenge</h1>

                    </div>
                    {!this.state.mainLoading && this.state.allCat !== [] && (
                        <CreateChallengeForm allCat={this.state.allCat} state={this.state} setState={this.setState.bind(this)} previewChallenge={this.previewChallenge.bind(this)} loadingStatus={this.state.loading}></CreateChallengeForm>
                    )}
                    {this.state.mainLoading && (
                        <div>
                            <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                                <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                            </div>
                        </div>
                    )}
                </div>
            </Layout>

        );
    }
}

export default UserChallengeCreate;