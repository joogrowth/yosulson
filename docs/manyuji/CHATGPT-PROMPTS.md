# 만유지 제작 지침

이름은 **만유지**다. 2026-10-22에 사용자가 아래 네 장을 만유지라고 확정했다. ChatGPT, 다른 이미지 AI, 어디서든 이 네 장과 마스터 프롬프트로 만든다.

사진 없이 글만 넣으면 얼굴이 바뀐다. 글 없이 다른 사진을 넣으면 이전 얼굴로 돌아간다.

## 올리는 사진

챗지피티는 주소만 붙여서는 사진을 열지 못한다. zip을 받아 풀고, jpg 4장을 입력창의 첨부 버튼으로 올린다.

zip: https://raw.githubusercontent.com/joogrowth/yosulson/cursor/manyuji-face-canon-9b9c/docs/manyuji/manyuji-chatgpt-7.zip

| 파일 | 역할 |
| --- | --- |
| `face-absolute.jpg` | 얼굴 정본. 왼쪽 정면, 오른쪽 옆면. 낮은 포니, 진주 스터드. |
| `locked-front.jpg` | 확정 전신 정면. 세로 3:4. |
| `locked-side.jpg` | 확정 전신 옆. 세로 3:4. |
| `locked-back.jpg` | 확정 전신 뒤. 세로 3:4. 엉덩이 모양은 이 장이다. |

한 메시지에 한 장면만 시킨다. 정면, 옆, 뒤를 한 번에 시키지 않는다. 얼굴이 다르면 그 이미지에 교정 프롬프트를 답장으로 붙인다.

올리지 않는다. 같이 올리면 얼굴이 섞인다.

- `body-white-front.jpg`, `body-white-side.jpg`, `body-white-back.jpg`
- `face-long-front.jpg`, `face-long-side.jpg`, `face-nose-side.jpg`
- `front.jpg`, `side.jpg`, `back.jpg`, `face.jpg`, `cafe-white-approved.jpg`
- `face-fit-front.jpg`, `face-fit-side.jpg`, `face-fit-source.jpg`
- `face-eye-smile-above.jpg`, `standard-sheet.jpg`

사진을 올린 뒤 아래 마스터 프롬프트를 첫 메시지로 붙인다. 그다음 컷 프롬프트 하나만 붙인다. 비율은 세로 3:4다.

얼굴이나 비율이 달라지면 그 결과에 교정 프롬프트를 답장으로 붙인다. 한 번에 한 부위만 고친다.

## 마스터 프롬프트

```text
The attached photos are the only canon for one fictional woman named 만유지. On 2026-10-22 the user locked these four files. face-absolute.jpg is the face: left half front, right half side. locked-front.jpg, locked-side.jpg, and locked-back.jpg are the full body. If any older photo disagrees, these four win.

Do not average her into a generic pretty woman. A new outfit or a new place is allowed only when the shot says so. Her face, default hair, and body proportions are not. A scene photo supplies background, pose, and scale only. Never copy the face of a woman already standing in that scene.

FACE, from face-absolute.jpg
Soft short face, full cheeks, low cheekbones, short round chin, forehead not wide. Thin dark brows with a soft arch. Large round dark-brown eyes, thin soft double eyelids, large glossy irises, aegyo-sal, thin eyeliner. Eyes stay large and open. Nose is small and low. The bridge rounds into a small tip with no corner and sits only a little ahead of the upper lip. From the front the bridge is one narrow soft highlight, with no dark borders. Full glossy peach-coral lips, lower lip slightly fuller, mouth barely parted, no teeth. Fair skin, light blush, small ears, pearl stud earrings.

HAIR
Default is the low ponytail in face-absolute.jpg and the three locked full-body photos. Light chestnut brown, center part, wispy strands along both cheeks, the tie sitting at the nape. Not a high ponytail. Not loose hair down the back, unless this shot explicitly asks for another hairstyle. Changing the hair never changes the face.

BODY, from the three locked full-body photos
Height is 7.5 heads. Vertical 3:4. Crown near the top edge, shoes near the bottom edge. Long slim neck, both collarbones visible, narrow rounded shoulders. Bust is a 70B: high, rounded forward, inside the shoulder width. The waist is the narrowest part and the waist section is short. Stomach is flat, navel small. Hips are wider than the waist and wider than the shoulders. From the side, bust forward, waist in, seat back, one hand on the waist. From the back, narrow back, a strip of lower-back skin, pelvis flaring immediately under the waist, round seat divided left and right, widest at the back pockets, continuing into the thigh with no gap underneath. Do not lift two spheres, do not cut a shelf, and do not taper the seat to a point. Keep the seat width in locked-back.jpg. Do not enlarge it. Thighs are long and soft, knees small, calves slim, ankles narrow. Hip-to-floor is longer than shoulder-to-hip. Jean hems end at the ankle bone.

LOCKED OUTFITS
Front: ivory ribbed short-sleeve square-neck crop, hem above the navel, light-wash high-rise skinny jeans, white thin-soled sneakers.
Side: black ribbed sleeveless square-neck crop, medium-blue high-rise skinny jeans, white thin-soled sneakers.
Back: sage short-sleeve crop with no logo, dark indigo high-rise skinny jeans, low ankle shoes as in locked-back.jpg.

Photorealistic. One woman. No text, no logo, no watermark. Keep this lock for the whole chat.
```

## 컷 프롬프트

마스터 프롬프트 다음에 하나만 보낸다.

### 앞

```text
Full-body front view, 3:4. Match locked-front.jpg and the face in face-absolute.jpg. Low ponytail at the nape, center part, cheek strands, pearl studs. She stands straight, arms relaxed, eyes toward the camera. Ivory ribbed short-sleeve square-neck crop, light-wash high-rise skinny jeans, white thin-soled sneakers. Plain bright room, pale wall, wood floor. Crown near the top, shoes near the bottom.
```

### 옆

```text
Full-body side view, 3:4. Match locked-side.jpg and the side face in face-absolute.jpg. Low ponytail, pearl stud. One hand on the waist. Bust forward, waist inward, seat backward, long thigh, slim calf. Black ribbed sleeveless square-neck crop, medium-blue high-rise skinny jeans, white thin-soled sneakers. Indoor concrete stair landing with a window. Crown near the top, shoes near the bottom.
```

### 뒤

```text
Full-body back view, 3:4. Match the seat in locked-back.jpg. Narrow back, short waist, round seat widest at the back pockets and continuing into the thigh. Low ponytail down the back. She turns her head enough to show the side face from face-absolute.jpg. Sage short-sleeve crop, dark indigo high-rise skinny jeans, the same low ankle shoes as locked-back.jpg. Quiet residential alley, afternoon light. Crown near the top, shoes near the bottom.
```

### 얼굴

```text
Close portrait, same framing as face-absolute.jpg. Left would be front and this shot is the front half only. Match that face exactly: large round dark-brown eyes, aegyo-sal, small low nose, glossy peach lips barely parted, pearl studs, light chestnut low ponytail with a center part and cheek strands. Cream collared knit. Soft even light. No teeth.
```

### 옷만 바꾸기

괄호만 바꾼다.

```text
Keep the face from face-absolute.jpg, the low ponytail, and the body in the three locked full-body photos. Change only the clothes and the place. New top: [색] fitted ribbed [반팔/긴팔/민소매] [스퀘어넥/스쿱넥], hem above the navel. New bottom: [연청/중간 블루/진청] high-rise skinny jeans, hem at the ankle. Thin-soled shoes. Full body, 3:4. Place: [장소]. Crown near the top, shoes near the bottom.
```

## 부위가 어긋났을 때

틀린 이미지에 답장으로 붙인다. 한 번에 한 부위만 고친다.

얼굴:

```text
Keep the body, pose, outfit, hair, and frame. Replace only the face with face-absolute.jpg. Large round dark-brown eyes with aegyo-sal, small low nose, glossy peach lips barely parted, pearl studs. Do not narrow the eyes. Do not lengthen the chin.
```

머리:

```text
Keep the face and the body. Change the hair to the low ponytail in face-absolute.jpg: light chestnut, center part, cheek strands, tie at the nape. Not a high ponytail and not hair worn down.
```

다리:

```text
Keep the face and outfit. Height stays 7.5 heads. Hip-to-floor longer than shoulder-to-hip. Long thigh, slim knee, slim calf, narrow ankle, jean hem at the ankle bone, thin sole. Crown near the top of the 3:4 frame, shoes near the bottom.
```

허리와 엉덩이:

```text
Keep the face and the long legs. The waist is the narrowest and shortest part. From the side, bust forward, waist in, seat back. From the back, match locked-back.jpg: the seat is widest at the back pockets and continues into the thigh. Do not enlarge it.
```

가슴:

```text
Keep the face and the legs. Narrow shoulders. Bust is a 70B, high and rounded forward, still inside the shoulder width. The waist narrows directly under the bust.
```
