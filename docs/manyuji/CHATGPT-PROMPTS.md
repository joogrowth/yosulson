# 만유지 ChatGPT 공유

이름은 **만유지**다. 2026-10-21에 고정한 얼굴과 전신만 쓴다.

## 올리는 사진

채팅에 뜬 그림은 파일이 아니라서 챗지피티에 올릴 수 없다. 아래 주소에서 받은 jpg 7장만 올린다. 공개 저장소 주소다.

| 파일 | 주소 |
| --- | --- |
| 확정 얼굴 정면 | https://raw.githubusercontent.com/joogrowth/yosulson/cursor/minyuji-image-guide-c4c8/docs/manyuji/references/face-long-front.jpg |
| 확정 얼굴 옆 | https://raw.githubusercontent.com/joogrowth/yosulson/cursor/minyuji-image-guide-c4c8/docs/manyuji/references/face-long-side.jpg |
| 코선과 얼굴 느낌 | https://raw.githubusercontent.com/joogrowth/yosulson/cursor/minyuji-image-guide-c4c8/docs/manyuji/references/face-nose-side.jpg |
| 확정 전신 정면 | https://raw.githubusercontent.com/joogrowth/yosulson/cursor/minyuji-image-guide-c4c8/docs/manyuji/references/body-white-front.jpg |
| 확정 전신 옆 | https://raw.githubusercontent.com/joogrowth/yosulson/cursor/minyuji-image-guide-c4c8/docs/manyuji/references/body-white-side.jpg |
| 확정 전신 뒤 | https://raw.githubusercontent.com/joogrowth/yosulson/cursor/minyuji-image-guide-c4c8/docs/manyuji/references/body-white-back.jpg |
| 엉덩이 모양만 | https://raw.githubusercontent.com/joogrowth/yosulson/cursor/minyuji-image-guide-c4c8/docs/manyuji/references/back.jpg |

각 주소를 열어 저장한 뒤, 챗지피티 새 채팅에 그 7장을 첨부한다. 파일 이름을 메시지에 같이 적는다. `back.jpg`의 얼굴은 쓰지 않는다.

올리지 않는다.

- `face-front.jpg`, `face-side.jpg`, `face.jpg`, `cafe-white-approved.jpg`
- `face-fit-front.jpg`, `face-fit-side.jpg`, `face-fit-source.jpg`
- `face-eye-smile-above.jpg` — 더 둥글고 매끈한 다른 얼굴
- `standard-sheet.jpg` — 선명함만 볼 때 따로 연다
- `front.jpg`, `side.jpg` — 비율 확인용. 얼굴은 이전 얼굴이라 기본 세트에 넣지 않는다

사진을 올린 뒤 아래 마스터 프롬프트를 첫 메시지로 붙인다. 그다음 컷 프롬프트 하나만 붙인다. 비율은 세로 3:4다.

얼굴이나 비율이 달라지면 그 결과에 교정 프롬프트를 답장으로 붙인다. 한 번에 한 부위만 고친다.

## 마스터 프롬프트

```text
The attached photos are the locked canon for one fictional woman named 만유지. The user confirmed her on 2026-10-21. This lock is absolute.

face-long-front.jpg is the front face. face-long-side.jpg is the side face. face-nose-side.jpg is the nose line and the face feeling. body-white-front.jpg, body-white-side.jpg, and body-white-back.jpg are the locked full body in a tight white short-sleeve tee, medium-blue high-rise skinny jeans, and white thin-soled sneakers, with long loose auburn hair. back.jpg is the seat shape only. Ignore the face in back.jpg.

Angle, pose, outfit, and place may change. Her face, skull, hair default, and body proportions may not. Do not invent a new face for a new angle. Do not average her into a generic pretty woman. Do not use an older narrower eye, a raised studio nose, a chestnut high ponytail, or a rounder smoother face.

FACE
Soft short face, full cheeks, low cheekbones, short round chin. Thin dark brows with a soft arch. Large round dark-brown eyes, thin soft double eyelids, large glossy irises, aegyo-sal, thin eyeliner. Eyes stay large and open. Nose width equals the gap between the inner eye corners. Nose length is shorter than the middle third of the face. The bridge is low and rounds into a small tip with no corner, matching face-nose-side.jpg. From the front that line is one narrow soft highlight, with no dark borders beside the bridge. The tip sits only a little ahead of the upper lip. Full glossy peach-coral lips, lower lip slightly fuller. At rest the mouth is closed or barely parted and no teeth show. An eye-smile, only when asked, lifts the lower eyelid a little on this same face. The iris stays visible. Do not shorten or lengthen the face when she smiles.

HAIR
Default hair is long loose auburn past the shoulders, as in face-long-front.jpg and face-long-side.jpg. No bun and no ponytail unless the shot asks for one.

SKULL
Narrow egg, a little longer front to back than side to side. Low rounded crown, narrow temples, low short occiput that rounds into the neck. The forehead is not wide.

BODY
Small head, about one eighth of her height. Long slim neck, both collarbones visible, narrow rounded shoulders. Bust is a 70B: high, rounded forward, and inside the shoulder width. The waist is the narrowest part and the waist section is short. Stomach is flat. Hips are wider than the waist and wider than the shoulders. From the side, bust forward, waist in, seat back. From the back, narrow back, pelvis flaring immediately under the waist, round seat divided left and right, widest at the back pockets, continuing into the thigh with no gap underneath. Do not lift two spheres, do not cut a shelf, and do not taper the seat to a point. Keep the seat width in back.jpg and body-white-back.jpg. Do not enlarge it. Thighs are long and soft, knees small, calves slim, ankles narrow. Hip-to-floor is longer than shoulder-to-hip. Jean hems end at the ankle bone. Shoe soles are thin.

FRAME
Vertical 3:4. Head near the top edge, shoes near the bottom edge. One woman. Photorealistic and sharp. No text, no logo, no watermark. Keep this lock for the whole chat.
```

## 컷 프롬프트

마스터 프롬프트 다음에 하나만 보낸다.

### 확정 전신 다시 보기

```text
Full-body front, side, and back, each 3:4. Match body-white-front.jpg, body-white-side.jpg, and body-white-back.jpg. Same face as face-long-front.jpg and face-long-side.jpg. Long loose auburn hair. Tight white short-sleeve tee, medium-blue high-rise skinny jeans, white thin-soled sneakers. Head near the top, shoes near the bottom.
```

### 앞

```text
Full-body front view, 3:4. Same locked face and the same body. Long loose auburn hair. She stands straight, arms relaxed, eyes toward the camera. Tight white short-sleeve tee tucked into medium-blue high-rise skinny jeans, white thin-soled sneakers. Plain bright room. Head near the top, shoes near the bottom.
```

### 옆

```text
Full-body side view, 3:4. Bust forward, short waist inward, seat backward, long thigh, slim calf. Long loose auburn hair, no ponytail. Tight white short-sleeve tee, medium-blue high-rise skinny jeans, white thin-soled sneakers. Indoor landing with a window. Head near the top, shoes near the bottom.
```

### 뒤

```text
Full-body back view, 3:4. Match the seat in body-white-back.jpg and back.jpg. Narrow back, short waist, round seat widest at the back pockets and continuing into the thigh. Long loose auburn hair down the back. Tight white short-sleeve tee, medium-blue high-rise skinny jeans, white thin-soled sneakers. She turns her head enough to show a little cheek. Head near the top, shoes near the bottom.
```

### 얼굴

```text
Waist-up front portrait, 3:4. Match face-long-front.jpg. Long loose auburn hair, large round eyes, the nose line of face-nose-side.jpg as one narrow soft highlight. Glossy peach lips, no teeth. Flower-shop daylight.
```

### 옷만 바꾸기

괄호만 바꾼다.

```text
Keep the locked face, long loose auburn hair, and all body proportions. Change only the clothes and the place. New top: [색] fitted [반팔/긴팔/민소매] top, hem above the navel. New bottom: [연청/중간 블루/진청] high-rise skinny jeans, hem at the ankle. Thin-soled shoes. Full body, 3:4. Place: [장소]. Head near the top, shoes near the bottom.
```

## 부위가 어긋났을 때

틀린 이미지에 답장으로 붙인다. 한 번에 한 부위만 고친다.

얼굴:

```text
Keep the body, pose, outfit, and frame. Replace only the face with face-long-front.jpg and face-long-side.jpg. Nose line from face-nose-side.jpg. Long loose auburn hair. Do not narrow the eyes. Do not lengthen the chin.
```

다리:

```text
Keep the face and outfit. Hip-to-floor longer than shoulder-to-hip. Long thigh, slim knee, slim calf, narrow ankle, jean hem at the ankle bone, thin sole. Head near the top, shoes near the bottom.
```

허리와 엉덩이:

```text
Keep the face and the long legs. The waist is the narrowest and shortest part. From the side, bust forward, waist in, seat back. From the back, match body-white-back.jpg: the seat is widest at the back pockets and continues into the thigh. Do not enlarge it.
```

가슴:

```text
Keep the face and the legs. Narrow shoulders. Bust is a 70B, high and rounded forward, still inside the shoulder width. The waist narrows directly under the bust.
```
