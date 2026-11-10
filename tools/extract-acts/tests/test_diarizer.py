from extract_acts.diarizer import (
    diarize_transcript,
)


def test_diarize_transcript_with_explicit_labels():
    raw_transcript = (
        "Alice: Hey team, let's review the sprint.\n"
        "Bob: Sounds good.\n"
        "Alice: I will prepare the presentation slides for tomorrow.\n"
        "Bob: Great, I will update the ticket status."
    )
    utterances = diarize_transcript(raw_transcript)
    assert len(utterances) == 4
    assert utterances[0].speaker == "Alice"
    assert utterances[1].speaker == "Bob"
    assert utterances[2].speaker == "Alice"
    assert utterances[2].text == "I will prepare the presentation slides for tomorrow."
    assert utterances[3].speaker == "Bob"
    assert utterances[3].text == "Great, I will update the ticket status."


def test_diarize_transcript_unlabeled_with_self_introductions():
    raw_transcript = (
        "Hello everyone, this is Alice speaking.\n"
        "Thanks for joining. I will send out the notes after this call.\n"
        "Hey Alice, Bob here.\n"
        "I will handle the database migration tonight."
    )
    utterances = diarize_transcript(raw_transcript)
    speakers = [u.speaker for u in utterances]
    assert speakers[0] == "Alice"
    assert speakers[1] == "Alice"
    assert speakers[2] == "Bob"
    assert speakers[3] == "Bob"


def test_diarize_transcript_unlabeled_turn_clustering():
    # Transcript with distinct conversational turn markers or empty lines indicating speaker changes
    raw_transcript = (
        "We need someone to look into the performance drop on login.\n"
        "I will profile the auth service this afternoon.\n"
        "\n"
        "Awesome, let me know what you find.\n"
        "I will also check the database connection pool."
    )
    utterances = diarize_transcript(raw_transcript)
    assert len(utterances) == 2
    # The two separated blocks should belong to distinct speakers
    assert utterances[0].speaker != utterances[1].speaker
    assert "I will profile" in utterances[0].text
    assert "I will also check" in utterances[1].text


def test_diarize_transcript_vocative_question_and_response():
    # Addressing someone often precedes that person speaking in the next turn
    raw_transcript = (
        "Charlie, could you review the PR?\n\nSure, I will review it before end of day."
    )
    utterances = diarize_transcript(raw_transcript)
    assert len(utterances) == 2
    # The response turn should be attributed to Charlie
    assert utterances[1].speaker == "Charlie"


def test_diarize_transcript_with_timestamps():
    raw_transcript = (
        "[00:01:05] Hi all, Alice here.\n"
        "[00:01:10] I will coordinate with DevOps.\n"
        "[00:01:25] Sounds good. I'll take care of QA testing."
    )
    utterances = diarize_transcript(raw_transcript)
    assert len(utterances) == 2 or len(utterances) == 3
    # First speaker is Alice
    assert utterances[0].speaker == "Alice"
    # Action in first block is Alice
    alice_utterance = next(u for u in utterances if "coordinate" in u.text)
    assert alice_utterance.speaker == "Alice"
