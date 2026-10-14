# 민유지 ChatGPT 프롬프트

ChatGPT에서 민유지를 만들 때의 순서다. 정확도는 참고 이미지를 붙였을 때 나온다. 글만 붙여서는 얼굴이 바뀐다.

## 사용 순서

1. 새 채팅을 연다.
2. 이 폴더의 이미지 네 장을 모두 올린다.
   - `references/front.jpg`
   - `references/side.jpg`
   - `references/back.jpg`
   - `references/face.jpg`
   - 한 장으로 올릴 거면 `standard-sheet.jpg`를 같이 올린다.
3. 아래 **세션 고정 프롬프트**를 먼저 보낸다.
4. 이어서 **컷 프롬프트** 하나만 보낸다. 한 번에 옷, 장소, 앵글을 여러 개 바꾸지 않는다.
5. 결과가 어긋나면 새로 그리지 말고, 그 이미지에 **교정 프롬프트**를 답장으로 붙인다.

이미지 비율은 3:4로 지정한다. ChatGPT에 비율 선택이 있으면 세로 3:4를 고른다.

## 세션 고정 프롬프트

매번 새 채팅의 첫 메시지로 붙인다.

```text
These four attached photos are the only canon for a fictional character named 민유지 (Min Yuji). Lock her face, leg length, and body ratio to these photos. The face close-up is the face reference. The front, three-quarter, and back photos are the proportion reference.

Identity lock:
- Korean woman in her mid-20s.
- Soft oval face, delicate jaw, fair skin, light blush.
- Large dark-brown eyes with aegyo-sal and thin eyeliner. Keep this slightly rounded eye shape. Do not make the eyes narrower.
- Small straight nose. Full natural pink lips.
- Chestnut-brown hair in a high ponytail, loose face-framing strands, long wavy tail.
- Small head, about one eighth of total height. Long neck. High waist.
- Figure-showing hourglass: full bust, very narrow waist, rounded hips.
- Long legs. The distance from hip to floor is longer than the distance from shoulder to hip. Long inseam to the ankle.
- Thin-soled shoes only. No platform soles, no chunky sneakers.

Clothing lock:
- Fitted ribbed top. Square neck or scoop neck, low enough to show the collarbone.
- Cropped, or tucked, so a slim strip of waist shows.
- High-rise skinny jeans unless a later message changes only the bottom.
- The outfit must show her figure. No oversized clothes.

Rules:
- Photorealistic, vertical 3:4.
- On full-body shots, place the head near the top edge and the shoes near the bottom edge.
- Invent a new place and a new pose. Do not copy the attached backgrounds.
- Do not copy store interiors, brand storefronts, plazas with fountains, low-angle selfies, or phone UI.
- No text, no logos, no watermarks, no brand names.
- One woman only.
- If I only change the outfit or the place, keep the same face and the same leg-to-body ratio.

Answer with the image only after I send a shot prompt. Remember this lock for the rest of the chat.
```

## 컷 프롬프트

세션 고정 프롬프트를 보낸 뒤에 필요한 것만 고른다.

### 정면 전신

```text
Full-body front view, 3:4. She stands straight, arms relaxed, looking at the camera. Same face as the face reference. Same long-leg ratio as the front reference. Outfit: fitted ivory ribbed short-sleeve square-neck crop top, light-wash high-rise skinny jeans, white thin-soled sneakers. A slim strip of midriff shows. New setting: a bright, plain room with a pale wall and wood floor. No text.
```

### 측면

```text
Full-body three-quarter side view, 3:4, so leg length can be judged. Same face, same long legs, high waist, narrow waist. One hand resting on the hip. Outfit: black ribbed sleeveless square-neck top, medium-blue high-rise skinny jeans, white thin-soled sneakers. New setting: an indoor concrete stair landing with a window. No text.
```

### 뒷모습

```text
Full-body back view, 3:4. She walks away and turns her head just enough to show a little of her cheek. Long legs, narrow waist, rounded hips, same ratio as the back reference. Outfit: plain sage-green short-sleeve crop tee with no logo, dark indigo high-rise skinny jeans, black slim ankle boots with a low heel. New setting: a quiet residential alley with potted plants in warm afternoon light. No signs, no text.
```

### 얼굴 확인

```text
Waist-up portrait, 3:4, for a face check. Match the attached face exactly: large dark rounded almond eyes, aegyo-sal, thin eyeliner, small nose, full pink lips, fair skin. Chestnut high ponytail with face-framing strands. Outfit: dusty-rose ribbed long-sleeve square-neck crop top. Soft window light in a cafe. No cup logos, no text.
```

### 새 코디만 바꾸기

옷만 바꿀 때 사용한다. 괄호 안을 원하는 옷으로 바꾼다.

```text
Keep the exact same face, hair, leg length, and body ratio as the attached canon. Change only the outfit. New outfit: [상의 색과 넥라인], fitted ribbed, slightly low neckline, cropped to show a slim strip of waist, with [청바지 워시] high-rise skinny jeans and thin-soled shoes. Full body, 3:4, new location: [장소]. New pose. No text, no logos.
```

예시:

```text
Keep the exact same face, hair, leg length, and body ratio as the attached canon. Change only the outfit. New outfit: black ribbed long-sleeve scoop-neck crop top, slightly low neckline, a slim strip of waist, medium-blue high-rise skinny jeans, white thin-soled sneakers. Full body, 3:4, new location: a quiet museum hallway with stone walls. She stands in a relaxed three-quarter pose. No text, no logos.
```

## 교정 프롬프트

결과 이미지에 답장으로 붙인다. 여러 문제를 한 문장에 섞지 않는다.

다리가 짧을 때:

```text
Regenerate this same shot. Keep her face and outfit. Make the legs longer. Smaller head, higher waist, longer inseam to the ankle, hip-to-floor longer than shoulder-to-hip. Thin soles, not platform shoes. Fill the 3:4 frame from head to shoes.
```

얼굴이 다른 사람일 때:

```text
Regenerate this same shot. Replace the face with the attached face reference. Same large dark eyes with aegyo-sal, small nose, full pink lips, fair skin, chestnut high ponytail. Do not change the body ratio or the outfit.
```

허리가 안 드러날 때:

```text
Regenerate this same shot. Keep the face and the long legs. Make the waist narrower and the hips rounder, matching the back reference. The fitted top must show the collarbone and a slim strip of waist.
```

눈이 너무 가늘어졌을 때:

```text
Regenerate the face to match the attached face photo. Eyes stay large and slightly rounded, with aegyo-sal and thin eyeliner. Do not narrow the eyes.
```

로고나 글자가 들어갔을 때:

```text
Regenerate the same image with no text, no logo, no watermark, and no brand mark on the clothes or in the background.
```

## 한 번에 붙여 쓰는 짧은 프롬프트

참고 이미지 네 장을 올린 뒤, 긴 세션 고정을 쓰기 어려우면 이것만 붙인다. 정확도는 세션 고정 프롬프트보다 낮다.

```text
Use the attached photos as the exact canon for 민유지. Match that face, those long legs, the high waist, narrow waist, and rounded hips. Do not copy the backgrounds. Photorealistic 3:4 full body. Fitted ribbed top with a slightly low neckline, cropped to show a slim strip of waist, high-rise skinny jeans, thin-soled shoes. Small head, long inseam. New place, new pose. No text, no logos.
```

## 실패로 보는 결과

- 머리가 크고 다리가 짧다.
- 허리가 낮거나 바짓단이 종아리에서 끝난다.
- 플랫폼 스니커즈다.
- 옷이 헐렁해 몸매가 안 보인다.
- 눈이 가늘거나, 다른 사람 얼굴이다.
- 편의점, 광장 분수, 브랜드 매장, 휴대폰 UI가 다시 나온다.
- 옷이나 배경에 글자와 로고가 있다.

이 경우 그 이미지를 정본으로 저장하지 않는다. 교정 프롬프트로 다시 만든다.
