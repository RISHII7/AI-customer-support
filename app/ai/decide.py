from app.ai.agent import write_reply, write_reply_async
from app.ai.classifier import classify, classify_async
from app.ai.rules import CUSTOMER_STEPS, resolve_issue
from app.ai.schemas import Decision


async def decide_async(thread: str, has_attachments: bool = False) -> Decision:
    """Run the AI steps for one email thread asynchronously."""
    classification = await classify_async(thread)

    def escalate(reason: str, proposed_action: str | None = None) -> Decision:
        return Decision(
            action="escalate",
            section=classification.section,
            reply=classification.acknowledgement,
            reason=reason,
            proposed_action=proposed_action,
        )

    if has_attachments:
        return escalate("The email has attachments")
    if classification.needs_human:
        return escalate(classification.reason)

    answer = await write_reply_async(thread, classification.section)
    if answer.action == "escalate":
        return escalate(answer.reasoning)
    if not answer.enough_information:
        return escalate("The knowledge base does not answer this")
    if answer.issue:
        step = resolve_issue(answer.issue)
        if step not in CUSTOMER_STEPS:
            return escalate(f"Next step: {step}", proposed_action=step)
    if answer.promises_an_action:
        return escalate("The reply promises an action")

    return Decision(
        action="reply",
        section=classification.section,
        reply=answer.reply,
        reason=answer.reasoning,
    )


def decide(thread: str, has_attachments: bool = False) -> Decision:
    """Run the AI steps for one email thread. The models propose, this function decides."""
    classification = classify(thread)

    def escalate(reason: str, proposed_action: str | None = None) -> Decision:
        return Decision(
            action="escalate",
            section=classification.section,
            reply=classification.acknowledgement,
            reason=reason,
            proposed_action=proposed_action,
        )

    if has_attachments:
        return escalate("The email has attachments")
    if classification.needs_human:
        return escalate(classification.reason)

    answer = write_reply(thread, classification.section)
    if answer.action == "escalate":
        return escalate(answer.reasoning)
    if not answer.enough_information:
        return escalate("The knowledge base does not answer this")
    if answer.issue:
        step = resolve_issue(answer.issue)
        if step not in CUSTOMER_STEPS:
            return escalate(f"Next step: {step}", proposed_action=step)
    if answer.promises_an_action:
        return escalate("The reply promises an action")

    return Decision(
        action="reply",
        section=classification.section,
        reply=answer.reply,
        reason=answer.reasoning,
    )
