"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, ThumbsUp, ThumbsDown, RotateCw } from "lucide-react"

export function KnowledgeTester() {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState("")

  const handleSubmit = () => {
    if (!question.trim()) return

    setIsLoading(true)

    // 模拟API请求
    setTimeout(() => {
      setResponse(
        "基于您的知识库，我们的智能销售助手提供了三种定价方案：基础版（98元/月/用户）、专业版（198元/月/用户）和企业版（398元/月/用户）。每个版本都有不同的功能集，基础版包含基本的AI对话和知识库功能，专业版增加了高级数据分析和自动化工作流，企业版则提供全套功能包括API集成和专属客户经理。对于20人的团队，我们建议选择专业版，可以提供更好的团队协作功能和数据分析能力。如果您有特定的预算考虑，我们也可以提供定制化方案。",
      )
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>测试问题</CardTitle>
          <CardDescription>输入一个问题来测试AI助手的回答质量</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="例如：我们公司有20人的销售团队，你们的产品价格是多少？"
            className="min-h-[200px]"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setQuestion("")}>
            清空
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !question.trim()}>
            {isLoading ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                发送测试
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI助手回答</CardTitle>
          <CardDescription>基于当前知识库的AI回答结果</CardDescription>
        </CardHeader>
        <CardContent>
          {response ? (
            <div className="flex space-x-2">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted rounded-lg p-3">
                <p className="text-sm whitespace-pre-line">{response}</p>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              {isLoading ? "生成回答中..." : "AI回答将显示在这里"}
            </div>
          )}
        </CardContent>
        {response && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">回答质量评价:</div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <ThumbsDown className="h-4 w-4 mr-1" />
                不满意
              </Button>
              <Button variant="outline" size="sm">
                <ThumbsUp className="h-4 w-4 mr-1" />
                满意
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
