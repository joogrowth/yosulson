# 만유지 ChatGPT 프롬프트

ChatGPT, 또는 다른 이미지 AI에 넣을 때 순서다.

1. 새 채팅을 연다.
2. 몸 정본 `references/front.jpg`, `references/side.jpg`, `references/back.jpg`와 얼굴 정본 `references/face-front.jpg`, `references/face-side.jpg`, `references/face-source.jpg`를 모두 올린다.
3. `references/face.jpg`, `references/cafe-white-approved.jpg`, `standard-sheet.jpg`는 올리지 않는다. 그 세 장의 얼굴은 이전 얼굴이다. `standard-sheet.jpg`는 몸매를 눈으로 확인할 때만 따로 본다.
4. 아래 마스터 프롬프트를 첫 메시지로 붙인다.
5. 그다음 컷 프롬프트 하나만 붙인다.
6. 얼굴이나 비율이 달라지면, 그 결과에 교정 프롬프트를 답장으로 붙인다. 새로 그리지 말고 틀린 부위를 문장으로 지정한다.

비율은 세로 3:4다.

## 마스터 프롬프트

```text
The attached photos are the canon for one fictional woman named 만유지. front.jpg, side.jpg, and back.jpg are the BODY only. Their faces are the previous face. Ignore those faces. face-front.jpg, face-side.jpg, and face-source.jpg are the only FACE. face-source.jpg is the three-quarter original the user chose. Match the nose bridge to that photo. face-front.jpg and face-side.jpg are the front and side reconstructions of the same woman. Do not use face.jpg, cafe-white-approved.jpg, or standard-sheet.jpg for the face. Do not average her into a generic pretty woman and do not return to the previous narrower, sleepier eyes, lower nose, or chestnut high ponytail. A new outfit or a new place is allowed. Her face and these body points are not. The face photos are not the bust reference. Keep the bust at a 70B that stays inside the shoulder width.

FACE, from face-front.jpg, face-side.jpg, and face-source.jpg
Oval face, a little longer than wide. Soft cheeks, narrow jaw, short round chin. Medium forehead with a few thin strands at the temples. Dark brown eyebrows, medium thickness, soft natural arch, not straight and not sharply raised. Large dark-brown eyes that are clearly open, distinct double eyelids, rounded almond shape, outer corners only a little lifted, visible aegyo-sal, thin eyeliner, long natural lashes, large irises. On a front view both eyes match face-front.jpg in size and eyelid. On a three-quarter or side view the iris stays visible, and the eye stays open. Small nose with a straight bridge that is not flat or low, round small tip, small nostrils, short philtrum. Take the bridge height from face-source.jpg. Full lips, lower lip slightly fuller than the upper, muted peach pink, mouth closed or only slightly parted, no teeth. Fair smooth skin, light blush, eyeliner and lip color, no freckles. Small ears with a tiny stud.

HAIR
Dark brown, close to black, with a warm brown sheen in the light. Default is a low ponytail, neat crown, thin strands at the forehead and beside the ears, tail falling down the back. Match the color and the low ponytail in the three face photos.

UPPER BODY, crown to underbust
Small head, about one eighth of her height. Long slim neck. Both collarbones visible. Narrow rounded shoulders, not broad, not square, no thick trapezius. Slim long arms, thin wrists, small hands. Bust is high, full, and rounded forward. From the front it stays inside the shoulder width. From the side it projects clearly from the ribcage. Under the bust the torso narrows at once.

MID BODY, underbust to hip
The waist is the narrowest part and the waist section is short. Stomach is flat and soft, not muscular. Navel is small. A cropped top shows one slim band of midriff, with the navel visible. Hip bones flare wider than the waist. On a high-rise jean the button sits just below the navel.

LOWER BODY, hip to feet
Upper thighs are soft and long, lightly touching at the top, then tapering. Thigh length is as long as the calf. Knees are small. Calves are slim and straight. Ankles are narrow and the ankle bone shows. Jean hems end at the ankle bone. Feet are small. Shoe soles are thin, so the leg line is not shortened.

SIDE SILHOUETTE, from side.jpg
Straight nose with the bridge from face-source.jpg, small tip, lips slightly ahead of the chin, chin rounded back. The profile matches face-side.jpg. Bust forward, waist inward, hip and seat backward. The fullest point of the hip meets the top of the thigh. Legs stay long and mostly straight.

BACK SILHOUETTE, from back.jpg. This seat shape is locked.
Narrow back, shoulder blades not prominent. A strip of lower-back skin between the crop top and the jeans. The waist is the narrowest point, then the pelvis flares immediately to the left and right. The seat is round and divided into a left and a right side. The widest point is the back-pocket line. Below the seat the curve continues into the back of the thigh, with no horizontal gap. Do not raise two separate spheres, do not cut a shelf under the seat, and do not taper the seat to a narrow point. Keep this width. Do not enlarge it. Thighs continue long behind the seat. Knees stay close. Calves and ankles stay slim.

PROPORTION
Vertical 3:4. Head near the top edge, shoes near the bottom edge. Hip-to-floor is longer than shoulder-to-hip. The lower body is longer than the upper body. Shoulders narrow, bust forward, waist smallest, hips wider than the shoulders.

CLOTHING THAT SHOWS THESE POINTS
Fitted ribbed top. Square neck or wide scoop, open enough to show the inner collarbone and the upper bust. Hem above the navel. High-rise skinny jeans, button under the navel, hem at the ankle, fabric following the thigh and seat. Thin soles.

The twelve points that must survive every image:
1 long oval face, large open dark eyes, clear double eyelid, rounded almond, aegyo-sal, small straight nose, full pink lips
2 dark brown low ponytail with thin face-framing strands, unless the shot says the hair is down
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

Photorealistic, sharp, and clean. best-standard.jpg is the sharpness reference only. Do not copy its face or its chestnut ponytail. One woman. No text, no logo, no watermark. Do not add grain or blur to fake a photograph. Keep this lock for the whole chat.
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
Waist-up portrait, 3:4, face matched to face-front.jpg and face-source.jpg. Slightly long oval face, large open dark-brown eyes, clear double eyelids, rounded almond, aegyo-sal, thin eyeliner, soft dark brows, small straight nose, full pink lips, fair skin with makeup. Dark brown low ponytail, thin strands at the temples. Long neck, both collarbones, bust inside the shoulder width. Black long-sleeve square-neck top. Warm wood wall, even light.
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
Keep the body, pose, outfit, and frame. Replace only the face and hair with face-front.jpg, face-side.jpg, and face-source.jpg: slightly long oval face, large open dark-brown eyes, clear double eyelids, rounded almond, aegyo-sal, small straight nose with the bridge from face-source.jpg, full pink lower lip, dark brown low ponytail with thin temple strands.
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
Keep everything else. Match the eyes to face-front.jpg and face-source.jpg: large, open, dark brown, clear double eyelid, rounded almond, aegyo-sal, thin eyeliner, large iris. Keep them open at a three-quarter angle.
```
