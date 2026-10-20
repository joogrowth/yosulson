# 만유지 ChatGPT 프롬프트

ChatGPT, 또는 다른 이미지 AI에 넣을 때 순서다.

1. 새 채팅을 연다.
2. `references/front.jpg`, `references/side.jpg`, `references/back.jpg`, `references/face.jpg`를 모두 올린다. `standard-sheet.jpg`도 같이 올린다.
3. 아래 마스터 프롬프트를 첫 메시지로 붙인다.
4. 그다음 컷 프롬프트 하나만 붙인다.
5. 얼굴이나 비율이 달라지면, 그 결과에 교정 프롬프트를 답장으로 붙인다. 새로 그리지 말고 틀린 부위를 문장으로 지정한다.

비율은 세로 3:4다.

## 마스터 프롬프트

```text
The attached photos are the only canon for one fictional woman named 만유지. front.jpg is the front body, side.jpg is the side body, back.jpg is the back body, and face.jpg is the face. Match every region below. Do not average her into a generic pretty woman. A new outfit or a new place is allowed. Her face and these body points are not.

FACE, from face.jpg
Oval face, a little longer than wide. Soft cheeks, narrow jaw, short round chin. Medium forehead with loose strands at both temples. Dark chestnut eyebrows, medium thickness, soft arch, not straight and not sharply raised. Large dark-brown eyes, double eyelids, slightly rounded almond shape, outer corners only a little lifted, visible aegyo-sal under the eyes, thin eyeliner, long natural lashes, large irises. Small low nose, straight bridge, round tip, small nostrils, short philtrum. Full lips, lower lip slightly fuller than the upper, muted pink, mouth closed in a faint smile, no teeth. Fair smooth skin, light blush only on the apples of the cheeks, no freckles. Small ears with a tiny stud.

HAIR
Chestnut brown with lighter brown strands. Default is a high ponytail with volume at the crown, long face-framing pieces on both cheeks, and a loose wavy tail that reaches the waist. Worn down, the hair passes the mid-back.

UPPER BODY, crown to underbust
Small head, about one eighth of her height. Long slim neck. Both collarbones visible. Narrow rounded shoulders, not broad, not square, no thick trapezius. Slim long arms, thin wrists, small hands. Bust is high, full, and rounded forward. From the front it stays inside the shoulder width. From the side it projects clearly from the ribcage. Under the bust the torso narrows at once.

MID BODY, underbust to hip
The waist is the narrowest part and the waist section is short. Stomach is flat and soft, not muscular. Navel is small. A cropped top shows one slim band of midriff, with the navel visible. Hip bones flare wider than the waist. On a high-rise jean the button sits just below the navel.

LOWER BODY, hip to feet
Upper thighs are soft and long, lightly touching at the top, then tapering. Thigh length is as long as the calf. Knees are small. Calves are slim and straight. Ankles are narrow and the ankle bone shows. Jean hems end at the ankle bone. Feet are small. Shoe soles are thin, so the leg line is not shortened.

SIDE SILHOUETTE, from side.jpg
Low straight nose, lips slightly ahead of the chin, chin rounded back. Bust forward, waist inward, hip and seat backward. The fullest point of the hip meets the top of the thigh. Legs stay long and mostly straight.

BACK SILHOUETTE, from back.jpg. This seat shape is locked.
Narrow back, shoulder blades not prominent. A strip of lower-back skin between the crop top and the jeans. The waist is the narrowest point, then the pelvis flares immediately to the left and right. The seat is round and divided into a left and a right side. The widest point is the back-pocket line. Below the seat the curve continues into the back of the thigh, with no horizontal gap. Do not raise two separate spheres, do not cut a shelf under the seat, and do not taper the seat to a narrow point. Keep this width. Do not enlarge it. Thighs continue long behind the seat. Knees stay close. Calves and ankles stay slim.

PROPORTION
Vertical 3:4. Head near the top edge, shoes near the bottom edge. Hip-to-floor is longer than shoulder-to-hip. The lower body is longer than the upper body. Shoulders narrow, bust forward, waist smallest, hips wider than the shoulders.

CLOTHING THAT SHOWS THESE POINTS
Fitted ribbed top. Square neck or wide scoop, open enough to show the inner collarbone and the upper bust. Hem above the navel. High-rise skinny jeans, button under the navel, hem at the ankle, fabric following the thigh and seat. Thin soles.

The twelve points that must survive every image:
1 large dark eyes with aegyo-sal, small low nose, full pink lips
2 chestnut high ponytail with face-framing strands, unless the shot says the hair is down
3 small head, long neck, narrow shoulders, visible collarbones
4 high forward bust inside the shoulder width
5 short narrow waist directly under the bust
6 flat soft stomach and small navel
7 hips wider than the waist
8 side view: bust forward, waist in, seat back
9 back view: narrow back, immediate hip flare, round seat widest at the back pockets and continuing into the thigh
10 long soft upper thighs, slim knees, slim calves, narrow ankles
11 hip-to-floor longer than shoulder-to-hip, jean hem at the ankle
12 fitted ribbed neckline and high-rise skinny jeans so those points stay visible

Photorealistic, sharp, and clean, at the finish of best-standard.jpg. One woman. No text, no logo, no watermark. Do not add grain or blur to fake a photograph. Keep this lock for the whole chat.
```

## 컷 프롬프트

마스터 프롬프트 다음에 하나만 보낸다.

### 앞

```text
Full-body front view, 3:4, same woman and the same twelve body points. She stands straight, arms relaxed, eyes toward the camera. Outfit: ivory ribbed short-sleeve square-neck crop top, hem above the navel, light-wash high-rise skinny jeans, white thin-soled sneakers. Plain bright room, pale wall, wood floor. Head near the top, shoes near the bottom.
```

### 옆

```text
Full-body three-quarter side view, 3:4. Read the side silhouette: bust forward, waist inward, seat backward, long thigh, slim calf, narrow ankle. One hand on the waist. Outfit: black ribbed sleeveless square-neck top, medium-blue high-rise skinny jeans, white thin-soled sneakers. Indoor concrete stair landing with a window.
```

### 뒤

```text
Full-body back view, 3:4. Narrow back, short waist, pelvis flaring just below the waist, round seat divided left and right, long thighs, close knees, slim calves. She walks away and turns her head enough to show a little of the cheek. Outfit: plain sage short-sleeve crop top with no mark, dark indigo high-rise skinny jeans, low ankle shoes with a thin sole. Quiet residential alley, afternoon light.
```

### 얼굴

```text
Waist-up portrait, 3:4, face matched to face.jpg. Oval face, large dark-brown eyes, aegyo-sal, thin eyeliner, soft arched brows, small low nose, full pink lips, fair skin. Chestnut high ponytail, loose strands on both cheeks. Long neck, both collarbones, high bust. Dusty-rose ribbed long-sleeve square-neck crop top. Soft cafe window light.
```

### 옷만 바꾸기

괄호만 바꾼다.

```text
Keep all twelve body points and the same face. Change only the clothes and the place. New top: [색] fitted ribbed [반팔/긴팔/민소매] [스퀘어넥/스쿱넥], hem above the navel, collarbone and upper bust visible. New bottom: [연청/중간 블루/진청] high-rise skinny jeans, hem at the ankle. Thin-soled shoes. Full body, 3:4. Place: [장소]. New pose. Head near the top, shoes near the bottom.
```

## 부위가 어긋났을 때

틀린 이미지에 답장으로 붙인다. 한 번에 한 부위만 고친다.

얼굴:

```text
Keep the body, pose, outfit, and frame. Replace only the face with face.jpg: oval face, large dark-brown eyes with aegyo-sal, soft arched brows, small low nose, full pink lower lip, chestnut high ponytail with cheek strands.
```

다리:

```text
Keep the face and outfit. Lengthen the lower body. Hip-to-floor longer than shoulder-to-hip. Long upper thigh, slim knee, slim calf, narrow ankle, jean hem at the ankle bone, thin sole. Head near the top of the 3:4 frame, shoes near the bottom.
```

허리와 골반:

```text
Keep the face and the long legs. Make the waist the narrowest and shortest part, stomach flat, hips wider than the waist. From the side, bust forward, waist in, seat back, and the fullest point of the seat meets the upper thigh. From the back, the pelvis flares immediately under the waist. The seat is round and divided, widest at the back pockets, then continues into the thigh. Do not enlarge it, do not lift it into two spheres, do not add a gap under it, and do not taper it to a point.
```

가슴과 어깨:

```text
Keep the face and the legs. Narrow rounded shoulders, visible collarbones, bust high and rounded forward but still inside the shoulder width. The ribbed neckline shows the upper bust. The waist narrows directly under the bust.
```

눈:

```text
Keep everything else. Match the eyes to face.jpg: large, dark brown, double eyelid, slightly rounded almond, aegyo-sal, thin eyeliner. Do not shrink them and do not make them narrow.
```
