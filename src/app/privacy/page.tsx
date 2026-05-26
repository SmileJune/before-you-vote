import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 투표전5분",
  description: "투표전5분 개인정보처리방침입니다."
};

const sections = [
  {
    title: "1. 처리하는 정보",
    body: [
      "투표전5분은 회원가입을 받지 않으며 이름, 연락처, 주민등록번호, 정확한 주소를 직접 수집하지 않습니다.",
      "서비스 이용 과정에서 사용자가 선택한 지역, 읍면동, 선거 항목이 브라우저에 저장될 수 있습니다.",
      "브라우저 위치 권한을 허용한 경우 현재 위치 좌표를 지역 추정에 사용할 수 있습니다.",
      "배포 플랫폼 또는 웹 서버는 IP 주소, User-Agent, 접속 시각 등 접속 로그를 자동으로 생성할 수 있습니다."
    ]
  },
  {
    title: "2. 이용 목적",
    body: [
      "사용자의 지역에 맞는 선거와 후보자 정보를 표시하기 위해 정보를 사용합니다.",
      "다음 방문 시 마지막으로 선택한 지역과 선거 항목을 복원하기 위해 브라우저 저장소를 사용합니다.",
      "서비스 장애 분석, 보안 유지, 비정상 접근 확인을 위해 접속 로그가 사용될 수 있습니다."
    ]
  },
  {
    title: "3. 위치 정보",
    body: [
      "현재 위치는 사용자의 지역을 추정하는 용도로만 사용합니다.",
      "위치 좌표는 서버에 저장하지 않으며, 브라우저 위치 권한은 사용자가 언제든 거부하거나 철회할 수 있습니다.",
      "위치 기반 추정 결과는 실제 투표구와 다를 수 있으므로 투표안내문과 주민등록상 주소를 기준으로 확인해야 합니다."
    ]
  },
  {
    title: "4. 브라우저 저장소",
    body: [
      "서비스는 선택한 지역과 선거 항목을 cookie 또는 localStorage에 저장할 수 있습니다.",
      "cookie에 저장되는 선택값은 최대 180일 동안 보관될 수 있습니다.",
      "사용자는 브라우저 설정에서 cookie와 사이트 데이터를 삭제해 저장된 선택값을 지울 수 있습니다."
    ]
  },
  {
    title: "5. 제3자 제공 및 외부 사이트",
    body: [
      "투표전5분은 수집한 정보를 제3자에게 판매하거나 제공하지 않습니다.",
      "후보자 사진, 선거공보, 공약 PDF, 공개자료 등 공식 자료를 열람할 때 중앙선거관리위원회 등 외부 사이트로 이동할 수 있습니다.",
      "외부 사이트 접속 이후의 개인정보 처리에는 해당 사이트의 정책이 적용됩니다."
    ]
  },
  {
    title: "6. 보관 기간",
    body: [
      "브라우저에 저장되는 선택값은 최대 180일 동안 보관될 수 있습니다.",
      "서버 접속 로그는 배포 플랫폼 또는 서버 설정에 따라 일정 기간 보관될 수 있으며, 서비스 운영과 보안 목적 범위에서 사용됩니다."
    ]
  },
  {
    title: "7. 문의",
    body: ["개인정보 관련 문의는 godhkekf244@gmail.com 으로 연락해 주세요."]
  }
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-white px-5 py-6 text-ink shadow-soft">
      <Link href="/" className="text-sm font-semibold text-civic underline underline-offset-2">
        투표전5분으로 돌아가기
      </Link>
      <header className="mt-6 border-b border-line pb-5">
        <p className="text-sm font-semibold text-civic">투표전5분</p>
        <h1 className="mt-2 text-2xl font-bold tracking-normal">개인정보처리방침</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          투표전5분은 공식 선거 정보를 확인하기 위한 서비스이며, 회원가입 없이 이용할 수 있습니다.
        </p>
        <p className="mt-2 text-xs text-muted">시행일: 2026년 5월 26일</p>
      </header>

      <div className="space-y-6 py-6">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-bold">{section.title}</h2>
            <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
